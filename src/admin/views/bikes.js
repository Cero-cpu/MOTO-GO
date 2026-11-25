import { BIKE_STATUS } from '../../services/site-api.js';
import { bikesApi, media } from '../../services/admin-api.js';
import { $, $$, formatMoney, imageSrc, normalize } from '../../lib/utils.js';
import { confirmAction, emptyState, esc, field, icon, invalid, mountPhotoManager, openDrawer, select, textarea, toggle } from '../ui.js';

const STATUS_OPTIONS = Object.entries(BIKE_STATUS).map(([value, label]) => ({ value, label }));

const DEFAULT_FILTER = { q: '', category: 'all', status: 'all', visibility: 'all', sort: 'recent' };
const filter = { ...DEFAULT_FILTER };

const SORTS = {
  recent: { label: 'Más recientes primero', fn: null }, // orden en que aparecen en la web
  name: { label: 'Nombre (A-Z)', fn: (a, b) => a.name.localeCompare(b.name, 'es') },
  'price-asc': { label: 'Precio: menor a mayor', fn: (a, b) => (a.price ?? Infinity) - (b.price ?? Infinity) },
  'price-desc': { label: 'Precio: mayor a menor', fn: (a, b) => (b.price ?? -Infinity) - (a.price ?? -Infinity) },
};

/** Busca en nombre, etiqueta, descripción, categoría, estado y precio ("95000", "95,000"). */
function matches(bike, query, categories) {
  if (!query) return true;
  const category = categories.find((c) => c.id === bike.category)?.label ?? '';
  const text = normalize(`${bike.name} ${bike.badge} ${bike.description} ${category} ${BIKE_STATUS[bike.status]}`);
  const digits = query.replace(/\D/g, '');
  const priceHit = digits.length >= 2 && bike.price && String(bike.price).includes(digits);
  return query.split(/\s+/).every((w) => text.includes(w)) || priceHit;
}

function row(bike, categories) {
  const category = categories.find((c) => c.id === bike.category)?.label ?? 'Sin categoría';
  const photos = bike.images.length;
  return `
    <article class="admin-row ${bike.published ? '' : 'is-hidden'}" data-id="${esc(bike.id)}">
      <img class="admin-row__thumb ${photos ? '' : 'img-fallback'}" src="${esc(imageSrc(bike.images[0], 200))}" alt="" data-fallback loading="lazy" decoding="async">
      <div class="admin-row__info">
        <p class="truncate font-bold text-white">${esc(bike.name)}</p>
        <p class="truncate text-xs text-gray-400">${esc(category)} · ${photos} ${photos === 1 ? 'foto' : 'fotos'}${bike.badge ? ` · ${esc(bike.badge)}` : ''}</p>
      </div>
      <div class="admin-row__meta">
        <span class="text-sm font-bold ${bike.price ? 'text-brand' : 'text-gray-500'}">${bike.price ? formatMoney(bike.price) : 'Sin precio'}</span>
        <span class="pill pill--${bike.status}">${BIKE_STATUS[bike.status]}</span>
        ${toggle({ label: bike.published ? 'Visible' : 'Oculta', name: 'published', checked: bike.published, attrs: 'data-action="toggle"' })}
      </div>
      <div class="admin-row__actions">
        <button type="button" class="icon-btn" data-action="edit" title="Editar" aria-label="Editar ${esc(bike.name)}">${icon('pen')}</button>
        <button type="button" class="icon-btn" data-action="duplicate" title="Duplicar" aria-label="Duplicar ${esc(bike.name)}">${icon('clone')}</button>
        <button type="button" class="icon-btn icon-btn--danger" data-action="delete" title="Eliminar" aria-label="Eliminar ${esc(bike.name)}">${icon('trash')}</button>
      </div>
    </article>`;
}

function openForm(ctx, bike) {
  const { categories, branches } = ctx.data;
  const isNew = !bike;
  const draft = structuredClone(bike ?? {
    id: crypto.randomUUID(), name: '', category: categories[0]?.id ?? '', badge: '', description: '',
    images: [], price: null, status: 'disponible', published: true, branches: [],
  });
  const original = [...draft.images];
  const images = [...draft.images];
  let uploaded = new Set();

  const body = `
    ${field({ label: 'Nombre del modelo', name: 'name', value: draft.name, required: true, placeholder: 'Ej: Súper Gato CG200cc', full: true })}
    ${select({ label: 'Categoría', name: 'category', value: draft.category, options: categories.map((c) => ({ value: c.id, label: c.label })) })}
    ${field({ label: 'Etiqueta sobre la foto', name: 'badge', value: draft.badge, placeholder: 'Ej: Nueva 0km', hint: 'Texto corto. Opcional.', attrs: 'maxlength="24"' })}
    ${field({ label: 'Precio (RD$)', name: 'price', type: 'number', value: draft.price ?? '', placeholder: 'Ej: 85000', hint: 'Déjalo vacío para no mostrar precio.', attrs: 'min="0" step="1" inputmode="numeric"' })}
    ${select({ label: 'Estado', name: 'status', value: draft.status, options: STATUS_OPTIONS, hint: 'Reservada y Vendida se marcan sobre la foto.' })}
    ${textarea({ label: 'Descripción', name: 'description', value: draft.description, placeholder: 'Motor, frenos, colores disponibles, garantía...' })}
    <fieldset class="sm:col-span-2">
      <legend class="field__label mb-1">Fotos</legend>
      <p class="field__hint mb-3">La primera es la portada (toca la ★ para cambiarla). Se reducen, se convierten a WebP y se suben solas.</p>
      <div class="photo-grid" data-photos></div>
    </fieldset>
    <fieldset class="sm:col-span-2">
      <legend class="field__label mb-1">Disponible en</legend>
      <p class="field__hint mb-3">Si no marcas ninguna, se muestra como disponible en todas las sucursales.</p>
      <div class="flex flex-wrap gap-2">
        ${branches.map((b) => `<label class="check"><input type="checkbox" name="branches" value="${esc(b.id)}" ${draft.branches.includes(b.id) ? 'checked' : ''}> ${esc(b.name)}</label>`).join('')}
      </div>
    </fieldset>
    <div class="sm:col-span-2">${toggle({ label: 'Publicada (visible en la web)', name: 'published', checked: draft.published })}</div>`;

  openDrawer({
    title: isNew ? 'Nueva moto' : 'Editar moto',
    submitLabel: isNew ? 'Crear moto' : 'Guardar cambios',
    body,
    onReady(form, { markDirty, setBusy }) {
      uploaded = mountPhotoManager($('[data-photos]', form), images, {
        upload: (file) => media.upload(file, `bikes/${draft.id}`),
        onChange: markDirty,
        onBusy: setBusy,
      });
    },
    async onSubmit(form) {
      const data = new FormData(form);
      const name = data.get('name').trim();
      if (!name) return invalid(form, 'name', 'Escribe el nombre del modelo.');
      const priceRaw = String(data.get('price')).trim();
      const price = priceRaw === '' ? null : Number(priceRaw);
      if (price !== null && !(price > 0)) return invalid(form, 'price', 'El precio debe ser un número mayor que 0 (o vacío).');

      const ok = await ctx.run(() => bikesApi.save({
        ...draft,
        name,
        category: data.get('category'),
        badge: data.get('badge').trim(),
        description: data.get('description').trim(),
        price,
        status: data.get('status'),
        published: form.elements.published.checked,
        branches: data.getAll('branches'),
        images: [...images],
      }), isNew ? 'Moto creada' : 'Moto actualizada');

      // Fotos que se quitaron de la moto: se borran del almacenamiento
      if (ok) media.remove(original.filter((k) => !images.includes(k)));
      return ok;
    },
    onClose(saved) {
      // Si se cancela, las fotos subidas en esta edición no se usan: se borran
      if (!saved) media.remove([...uploaded]);
    },
  });
}

export default {
  render(el, ctx) {
    const { bikes, categories } = ctx.data;
    const published = bikes.filter((b) => b.published).length;

    el.innerHTML = `
      <div class="admin-toolbar">
        <div>
          <h1 class="heading-font text-4xl leading-none">Motos</h1>
          <p class="mt-1 text-sm text-gray-400">${published} publicadas de ${bikes.length}. Las nuevas aparecen primero en el catálogo.</p>
        </div>
        <button type="button" class="btn py-3 text-lg" data-action="new">${icon('plus')} Nueva moto</button>
      </div>
      <div class="admin-search mb-3">
        <label class="admin-search__box">
          ${icon('magnifying-glass')}
          <input class="input" type="search" placeholder="Buscar por nombre, etiqueta, descripción o precio…  (atajo: /)" value="${esc(filter.q)}" data-filter="q" data-search aria-label="Buscar motos" autocomplete="off">
        </label>
        <select class="input" data-filter="category" aria-label="Categoría">
          <option value="all">Todas las categorías</option>
          ${categories.map((c) => `<option value="${esc(c.id)}">${esc(c.label)}</option>`).join('')}
        </select>
        <select class="input" data-filter="status" aria-label="Estado">
          <option value="all">Cualquier estado</option>
          ${STATUS_OPTIONS.map((s) => `<option value="${s.value}">${s.label}</option>`).join('')}
        </select>
        <select class="input" data-filter="visibility" aria-label="Visibilidad">
          <option value="all">Visibles y ocultas</option>
          <option value="visible">Solo visibles</option>
          <option value="hidden">Solo ocultas</option>
        </select>
        <select class="input" data-filter="sort" aria-label="Ordenar">
          ${Object.entries(SORTS).map(([value, s]) => `<option value="${value}">${s.label}</option>`).join('')}
        </select>
      </div>
      <div class="mb-4 flex min-h-[2rem] items-center justify-between gap-3 text-sm text-gray-400">
        <span data-result-count aria-live="polite"></span>
        <button type="button" class="font-bold text-brand hover:underline" data-action="clear-filters" hidden>Limpiar filtros</button>
      </div>
      <div class="space-y-3" data-list></div>`;

    // Restaura los filtros elegidos (se conservan al guardar o cambiar de pestaña)
    $$('select[data-filter]', el).forEach((s) => { s.value = filter[s.dataset.filter]; });

    const listEl = $('[data-list]', el);
    const renderList = () => {
      const q = normalize(filter.q);
      let list = bikes.filter((b) =>
        (filter.category === 'all' || b.category === filter.category) &&
        (filter.status === 'all' || b.status === filter.status) &&
        (filter.visibility === 'all' || b.published === (filter.visibility === 'visible')) &&
        matches(b, q, categories));
      if (SORTS[filter.sort].fn) list = [...list].sort(SORTS[filter.sort].fn);

      const filtered = Object.keys(DEFAULT_FILTER).some((k) => k !== 'sort' && filter[k] !== DEFAULT_FILTER[k]);
      $('[data-result-count]', el).textContent = filtered ? `${list.length} de ${bikes.length} motos` : `${bikes.length} motos`;
      $('[data-action="clear-filters"]', el).hidden = !filtered;

      listEl.innerHTML = list.length
        ? list.map((b) => row(b, categories)).join('')
        : emptyState(bikes.length ? 'Ninguna moto coincide con la búsqueda.' : 'Aún no hay motos. Crea la primera con «Nueva moto».');
    };
    renderList();

    el.oninput = (e) => {
      const key = e.target.dataset.filter;
      if (!key) return;
      filter[key] = e.target.value;
      renderList();
    };

    el.onchange = (e) => {
      if (e.target.dataset.action !== 'toggle') return;
      const bike = bikes.find((b) => b.id === e.target.closest('[data-id]').dataset.id);
      const visible = e.target.checked;
      ctx.run(() => bikesApi.setPublished(bike.id, visible), visible ? `«${bike.name}» visible en la web` : `«${bike.name}» oculta`);
    };

    el.onclick = (e) => {
      const action = e.target.closest('button[data-action]')?.dataset.action;
      if (!action) return;
      if (action === 'new') return openForm(ctx);
      if (action === 'clear-filters') {
        Object.assign(filter, DEFAULT_FILTER, { sort: filter.sort });
        $('[data-search]', el).value = '';
        $$('select[data-filter]', el).forEach((s) => { s.value = filter[s.dataset.filter]; });
        renderList();
        return $('[data-search]', el).focus();
      }

      const bike = bikes.find((b) => b.id === e.target.closest('[data-id]')?.dataset.id);
      if (!bike) return;
      if (action === 'edit') openForm(ctx, bike);
      if (action === 'duplicate') ctx.run(() => bikesApi.duplicate(bike), 'Copia creada (oculta hasta que la publiques)');
      if (action === 'delete' && confirmAction(`¿Eliminar «${bike.name}» y sus fotos? Esta acción no se puede deshacer.`)) {
        ctx.run(() => bikesApi.remove(bike), 'Moto eliminada');
      }
    };
  },
};
