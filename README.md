# Motogo — web y panel de administración

Web de Motogo (La Vega • Bonao • SFM • Moca) con catálogo, ofertas, calculadora de financiamiento
y un panel para que el dueño gestione todo **sin tocar código**.

| Pieza            | Tecnología                                                                  |
|------------------|------------------------------------------------------------------------------|
| Web y panel      | HTML + JavaScript (módulos ES), compilado con **Vite**                      |
| Estilos          | **Tailwind CSS** compilado (solo las clases usadas) + componentes propios   |
| Base de datos    | **Supabase** (PostgreSQL) con reglas de seguridad RLS                       |
| Imágenes         | **Supabase Storage** (bucket `media`); en la BD solo se guarda la ruta      |
| Acceso al panel  | **Supabase Auth** (correo + contraseña) y tabla `admins`                    |

---

## Puesta en marcha (local)

Requisitos: Node 20+, Docker y [Supabase CLI](https://supabase.com/docs/guides/cli).

```bash
npm install                 # dependencias
npm run db:start            # base de datos local (Docker) — puertos 55421-55429
npm run db:reset            # crea las tablas y carga los datos de ejemplo
npm run admin:create -- correo@ejemplo.com 'Contraseña-segura'   # usuario del panel
npm run dev                 # web en http://127.0.0.1:5173  ·  panel en /admin/
```

`.env.local` (no se sube a git) contiene la URL y la clave pública de Supabase local.
Ver `.env.example`. Supabase Studio (ver la BD visualmente): http://127.0.0.1:55423

Otros comandos: `npm run build` (versión optimizada en `dist/`), `npm run preview` (servirla en http://127.0.0.1:8080),
`npm run db:stop`.

---

## Estructura

```
index.html                  Web pública (estructura; los datos llegan de la BD)
admin/index.html            Panel (acceso + secciones)
public/                     Archivos tal cual: logos optimizados, favicon, robots.txt
src/
  main.js                   Arranque de la web (caché + 1 petición + repintado parcial)
  admin.js                  Arranque del panel
  config.js                 Conexión a Supabase y valores de respaldo
  styles/
    site.css · admin.css    Hojas de entrada (orden: base → componentes → utilidades)
    fonts.css               Fuentes alojadas en la web (sin Google Fonts)
    components.css          Componentes compartidos (botones, cards, modal...)
    admin-components.css    Componentes del panel
  lib/
    utils.js                Utilidades: formato, WhatsApp, imágenes responsive, iconos, cuota
    image.js                Compresión de fotos en el navegador (WebP 640 px y 1600 px)
  services/
    site-api.js             Lectura pública (fetch directo, sin librería) + caché
    admin-api.js            Panel: sesión, guardado, subida/borrado de imágenes
  components/               Partes de la web: catálogo, ficha, calculadora, ofertas, sucursales, menú
  admin/
    main.js · ui.js         Acceso, pestañas y piezas de interfaz del panel
    views/                  Motos · Ofertas · Sucursales · Ajustes
supabase/
  migrations/               Esquema de la BD (tablas, seguridad, funciones, almacenamiento)
  seed.sql                  Datos de ejemplo (37 motos, 4 categorías, 4 sucursales)
scripts/
  vite-plugins.js           Sprite de iconos, precarga de fuente, CSS incrustado
  create-admin.mjs          Crear/promover administradores
```

### Base de datos (resumen)

`categories` · `branches` · `bikes` → `bike_images` (rutas, orden = portada) · `bike_branches` ·
`offers` · `settings` (una fila) · `admins`.

- **Lectura pública**: solo motos publicadas y ofertas vigentes (zona horaria de RD), en una sola
  llamada: `get_site_data()`.
- **Escritura**: solo usuarios de `admins`. Lo aplica Postgres (RLS), no el navegador.
- **Imágenes**: cada foto se guarda como `<clave>-640.webp` y `<clave>-1600.webp`; la web elige
  el tamaño según la pantalla (`srcset`). Al quitar fotos o borrar motos se borran sus archivos.

---

## Rendimiento

Medido con Lighthouse (móvil, red lenta simulada), página original → actual:

| Métrica               | Antes      | Ahora        |
|-----------------------|------------|--------------|
| Rendimiento           | 52         | **98–99**    |
| LCP (carga principal) | 5,7 s      | **2,2 s**    |
| Bloqueo (TBT)         | 1.120 ms   | **10–80 ms** |
| Accesibilidad / SEO   | 81 / 91    | **100 / 100**|
| Peso de la página     | 771 KB     | **277 KB**   |

Claves: Tailwind compilado (sin CDN), CSS incrustado en el HTML, fuentes propias con precarga,
solo los iconos usados, imágenes responsive, catálogo pintado al acercarse, datos en 1 petición
con caché, y la librería de Supabase solo en el panel.

---

## Publicar (producción)

1. **Crear el proyecto** en [supabase.com](https://supabase.com) (plan gratuito).
2. **Subir el esquema**: `supabase link --project-ref <ref>` y `supabase db push`.
   (Los datos de ejemplo NO se suben con `db push`; si se quieren: ejecutar `supabase/seed.sql`
   en el SQL Editor.)
3. En Supabase → *Authentication → Sign In / Providers*: **desactivar "Allow new users to sign up"**.
4. **Administrador**: `SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… npm run admin:create -- correo 'clave'`
   (la *service_role key* nunca va en la web ni en `.env` de Vite).
5. Crear `.env.production` con `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` del proyecto.
6. `npm run build` y subir la carpeta `dist/` a un hosting estático
   (Cloudflare Pages, Netlify o Vercel — gratis). Comando de build: `npm run build`, salida: `dist`.

## Pendiente

- Sustituir las fotos de ejemplo por fotos reales desde el panel.
- Descripción real de la sucursal de **Moca**.
