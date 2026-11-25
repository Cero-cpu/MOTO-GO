-- =============================================================================
-- Motogo — esquema inicial
--
-- Regla: las imágenes NO se guardan en la base de datos. Viven en Supabase
-- Storage (bucket "media") y aquí solo se guarda su RUTA.
--
-- Seguridad (RLS): el público solo LEE lo publicado; solo los usuarios de la
-- tabla `admins` pueden escribir. Las reglas las aplica Postgres, no el navegador.
-- =============================================================================

create extension if not exists pgcrypto with schema extensions;

-- -----------------------------------------------------------------------------
-- Tipos
-- -----------------------------------------------------------------------------
create type public.bike_status as enum ('disponible', 'reservada', 'vendida');

-- -----------------------------------------------------------------------------
-- Utilidades
-- -----------------------------------------------------------------------------

-- Mantiene updated_at al día
create function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- -----------------------------------------------------------------------------
-- Administradores
-- -----------------------------------------------------------------------------
create table public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
comment on table public.admins is 'Usuarios con permiso para editar desde el panel.';

-- ¿El usuario actual es administrador? (security definer: puede leer admins aunque RLS lo oculte)
create function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admins where user_id = (select auth.uid()));
$$;

-- -----------------------------------------------------------------------------
-- Catálogo
-- -----------------------------------------------------------------------------
create table public.categories (
  id         text primary key check (id ~ '^[a-z0-9-]+$'),
  label      text not null check (length(trim(label)) > 0),
  sort_order int  not null default 0
);

create table public.branches (
  id          text primary key check (id ~ '^[a-z0-9-]+$'),
  name        text not null check (length(trim(name)) > 0),
  short_name  text not null,
  full_name   text not null default '',
  tag         text not null default '',
  description text not null default '',
  sort_order  int  not null default 0
);

create table public.bikes (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (length(trim(name)) > 0),
  category_id text not null references public.categories (id) on update cascade on delete restrict,
  badge       text not null default '' check (length(badge) <= 40),
  description text not null default '',
  price       numeric(12, 2) check (price is null or price > 0),
  status      public.bike_status not null default 'disponible',
  published   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index bikes_listing_idx on public.bikes (published, created_at desc);
create index bikes_category_idx on public.bikes (category_id);
create trigger bikes_touch before update on public.bikes
  for each row execute function public.touch_updated_at();

-- Fotos de cada moto: `path` es la ruta dentro del bucket "media"
-- (o una URL absoluta para fotos externas). position 0 = portada.
create table public.bike_images (
  id         uuid primary key default gen_random_uuid(),
  bike_id    uuid not null references public.bikes (id) on delete cascade,
  path       text not null,
  position   int  not null default 0,
  created_at timestamptz not null default now()
);
create index bike_images_bike_idx on public.bike_images (bike_id, position);

create table public.bike_branches (
  bike_id   uuid not null references public.bikes (id) on delete cascade,
  branch_id text not null references public.branches (id) on update cascade on delete cascade,
  primary key (bike_id, branch_id)
);
create index bike_branches_branch_idx on public.bike_branches (branch_id);

-- -----------------------------------------------------------------------------
-- Ofertas
-- -----------------------------------------------------------------------------
create table public.offers (
  id          uuid primary key default gen_random_uuid(),
  title       text not null check (length(trim(title)) > 0),
  tag         text not null default '',
  description text not null default '',
  image_path  text,
  button_text text not null default '',
  wa_message  text not null default '',
  starts_at   date,
  ends_at     date,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint offers_dates_chk check (starts_at is null or ends_at is null or ends_at >= starts_at)
);
create index offers_live_idx on public.offers (active, starts_at, ends_at);
create trigger offers_touch before update on public.offers
  for each row execute function public.touch_updated_at();

-- -----------------------------------------------------------------------------
-- Ajustes (una sola fila)
-- -----------------------------------------------------------------------------
create table public.settings (
  id            smallint primary key default 1 check (id = 1),
  whatsapp      text     not null check (whatsapp ~ '^[0-9]{10,15}$'),
  phone_display text     not null default '',
  monthly_rate  numeric(6, 5) not null check (monthly_rate between 0 and 0.2),
  terms         int[]    not null check (cardinality(terms) > 0),
  default_term  int      not null,
  price_min     int      not null,
  price_max     int      not null,
  price_step    int      not null default 5000,
  price_default int      not null,
  down_min      int      not null,
  down_max      int      not null,
  down_step     int      not null default 5,
  down_default  int      not null,
  updated_at    timestamptz not null default now(),
  constraint settings_price_chk check (price_min < price_max and price_default between price_min and price_max),
  constraint settings_down_chk  check (down_min < down_max and down_default between down_min and down_max)
);
create trigger settings_touch before update on public.settings
  for each row execute function public.touch_updated_at();

-- -----------------------------------------------------------------------------
-- Seguridad: Row Level Security
-- -----------------------------------------------------------------------------
alter table public.admins        enable row level security;
alter table public.categories    enable row level security;
alter table public.branches      enable row level security;
alter table public.bikes         enable row level security;
alter table public.bike_images   enable row level security;
alter table public.bike_branches enable row level security;
alter table public.offers        enable row level security;
alter table public.settings      enable row level security;

-- Lectura pública
create policy "public read" on public.categories for select using (true);
create policy "public read" on public.branches   for select using (true);
create policy "public read" on public.settings   for select using (true);

create policy "public read published" on public.bikes
  for select using (published or (select public.is_admin()));

create policy "public read published" on public.bike_images
  for select using (exists (select 1 from public.bikes b where b.id = bike_id and (b.published or (select public.is_admin()))));

create policy "public read published" on public.bike_branches
  for select using (exists (select 1 from public.bikes b where b.id = bike_id and (b.published or (select public.is_admin()))));

-- Ofertas: el público solo ve las vigentes (fecha de República Dominicana)
create policy "public read live" on public.offers
  for select using (
    (select public.is_admin())
    or (active
        and (starts_at is null or starts_at <= (now() at time zone 'America/Santo_Domingo')::date)
        and (ends_at   is null or ends_at   >= (now() at time zone 'America/Santo_Domingo')::date))
  );

-- Escritura solo para administradores
create policy "admin write" on public.categories    for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admin write" on public.branches      for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admin write" on public.bikes         for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admin write" on public.bike_images   for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admin write" on public.bike_branches for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admin write" on public.offers        for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admin update" on public.settings     for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- admins: cada usuario solo puede ver su propia fila (para saber si es admin)
create policy "self read" on public.admins for select to authenticated using (user_id = (select auth.uid()));

-- -----------------------------------------------------------------------------
-- Lectura en UNA sola petición: get_site_data()
-- security invoker → respeta RLS: el público recibe solo lo publicado,
-- un administrador recibe todo (para el panel).
-- -----------------------------------------------------------------------------
create function public.get_site_data() returns jsonb
language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object(
    'categories', coalesce((
      select jsonb_agg(jsonb_build_object('id', c.id, 'label', c.label) order by c.sort_order, c.label)
      from public.categories c), '[]'::jsonb),
    'branches', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', b.id, 'name', b.name, 'short', b.short_name, 'fullName', b.full_name,
        'tag', b.tag, 'description', b.description) order by b.sort_order, b.name)
      from public.branches b), '[]'::jsonb),
    'bikes', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', k.id, 'name', k.name, 'category', k.category_id, 'badge', k.badge,
        'description', k.description, 'price', k.price, 'status', k.status,
        'published', k.published, 'createdAt', k.created_at, 'updatedAt', k.updated_at,
        'images', coalesce((select jsonb_agg(i.path order by i.position, i.created_at)
                            from public.bike_images i where i.bike_id = k.id), '[]'::jsonb),
        'branches', coalesce((select jsonb_agg(bb.branch_id)
                              from public.bike_branches bb where bb.bike_id = k.id), '[]'::jsonb)
      ) order by k.created_at desc)
      from public.bikes k), '[]'::jsonb),
    'offers', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', o.id, 'title', o.title, 'tag', o.tag, 'description', o.description,
        'image', o.image_path, 'buttonText', o.button_text, 'waMessage', o.wa_message,
        'startsAt', o.starts_at, 'endsAt', o.ends_at, 'active', o.active) order by o.created_at desc)
      from public.offers o), '[]'::jsonb),
    'settings', (
      select jsonb_build_object(
        'contact', jsonb_build_object('whatsapp', s.whatsapp, 'phoneDisplay', s.phone_display),
        'finance', jsonb_build_object(
          'monthlyRate', s.monthly_rate, 'terms', to_jsonb(s.terms), 'defaultTerm', s.default_term,
          'price', jsonb_build_object('min', s.price_min, 'max', s.price_max, 'step', s.price_step, 'default', s.price_default),
          'downPayment', jsonb_build_object('min', s.down_min, 'max', s.down_max, 'step', s.down_step, 'default', s.down_default)))
      from public.settings s where s.id = 1)
  );
$$;

-- -----------------------------------------------------------------------------
-- Escrituras del panel en una transacción (todo o nada)
-- -----------------------------------------------------------------------------

-- Crea o actualiza una moto con sus fotos y sucursales. Devuelve el id.
create function public.save_bike(p jsonb) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare
  v_id uuid := coalesce(nullif(p->>'id', '')::uuid, gen_random_uuid());
begin
  if not (select public.is_admin()) then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  insert into public.bikes (id, name, category_id, badge, description, price, status, published)
  values (
    v_id, trim(p->>'name'), p->>'category', coalesce(trim(p->>'badge'), ''), coalesce(trim(p->>'description'), ''),
    nullif(p->>'price', '')::numeric, coalesce(p->>'status', 'disponible')::public.bike_status,
    coalesce((p->>'published')::boolean, true))
  on conflict (id) do update set
    name = excluded.name, category_id = excluded.category_id, badge = excluded.badge,
    description = excluded.description, price = excluded.price, status = excluded.status,
    published = excluded.published;

  delete from public.bike_images where bike_id = v_id;
  insert into public.bike_images (bike_id, path, position)
  select v_id, value, ordinality - 1
  from jsonb_array_elements_text(coalesce(p->'images', '[]'::jsonb)) with ordinality;

  delete from public.bike_branches where bike_id = v_id;
  insert into public.bike_branches (bike_id, branch_id)
  select v_id, value from jsonb_array_elements_text(coalesce(p->'branches', '[]'::jsonb));

  return v_id;
end $$;

-- Reordena sucursales según la lista de ids recibida
create function public.reorder_branches(ids text[]) returns void
language plpgsql security invoker set search_path = '' as $$
begin
  if not (select public.is_admin()) then
    raise exception 'No autorizado' using errcode = '42501';
  end if;
  update public.branches b set sort_order = x.ord
  from unnest(ids) with ordinality as x(id, ord) where b.id = x.id;
end $$;

-- Guarda categorías: actualiza nombres/orden, crea las nuevas y borra las que no vengan
-- (fallará si alguna moto aún usa una categoría borrada: on delete restrict)
create function public.save_categories(items jsonb) returns void
language plpgsql security invoker set search_path = '' as $$
begin
  if not (select public.is_admin()) then
    raise exception 'No autorizado' using errcode = '42501';
  end if;
  delete from public.categories
  where id not in (select x->>'id' from jsonb_array_elements(items) x);
  insert into public.categories (id, label, sort_order)
  select x->>'id', trim(x->>'label'), (ord - 1)::int
  from jsonb_array_elements(items) with ordinality as t(x, ord)
  on conflict (id) do update set label = excluded.label, sort_order = excluded.sort_order;
end $$;

-- Permisos de ejecución
revoke execute on function public.save_bike(jsonb)          from public, anon;
revoke execute on function public.reorder_branches(text[])  from public, anon;
revoke execute on function public.save_categories(jsonb)    from public, anon;
grant  execute on function public.save_bike(jsonb)          to authenticated;
grant  execute on function public.reorder_branches(text[])  to authenticated;
grant  execute on function public.save_categories(jsonb)    to authenticated;
grant  execute on function public.get_site_data()           to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Almacenamiento de imágenes
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880, array['image/webp', 'image/jpeg', 'image/png', 'image/avif'])
on conflict (id) do nothing;

create policy "media public read" on storage.objects
  for select using (bucket_id = 'media');
create policy "media admin insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'media' and (select public.is_admin()));
create policy "media admin update" on storage.objects
  for update to authenticated using (bucket_id = 'media' and (select public.is_admin()));
create policy "media admin delete" on storage.objects
  for delete to authenticated using (bucket_id = 'media' and (select public.is_admin()));
