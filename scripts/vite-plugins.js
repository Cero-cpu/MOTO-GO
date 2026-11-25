/**
 * Plugins de Vite propios de Motogo.
 *
 * iconSprite: inserta en cada página un sprite SVG SOLO con los iconos que esa página usa
 *   (`<use href="#i-nombre">` en el HTML o `icon('nombre')` en su JS). Sustituye a la hoja
 *   completa de Font Awesome (~100 KB + fuentes). Falla el build si un icono no existe.
 *   Iconos: Font Awesome Free 6 (CC BY 4.0) — https://fontawesome.com/license/free
 *
 * fontPreload: añade <link rel="preload"> para la fuente de los títulos (evita el "salto" al cargar).
 *
 * inlineCss: mete el CSS dentro del HTML de las páginas indicadas (~6 KB comprimido): la página
 *   se pinta sin esperar a descargar otro archivo (elimina un viaje de red que bloquea el render).
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { fab } from '@fortawesome/free-brands-svg-icons';

const ICONS = new Map();
for (const def of [...Object.values(fas), ...Object.values(fab)]) {
  ICONS.set(def.iconName, def.icon);
  for (const alias of def.icon[2]) if (typeof alias === 'string') ICONS.set(alias, def.icon);
}

const USE_RE = /#i-([a-z0-9-]+)/g;
const CALL_RE = /icon\(\s*['"]([a-z0-9-]+)['"]/g;

function filesIn(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? filesIn(path) : path.endsWith('.js') ? [path] : [];
  });
}

function collect(sources) {
  const names = new Set();
  for (const text of sources) {
    for (const m of text.matchAll(USE_RE)) names.add(m[1]);
    for (const m of text.matchAll(CALL_RE)) names.add(m[1]);
  }
  return names;
}

function sprite(names, page) {
  const missing = [...names].filter((n) => !ICONS.has(n));
  if (missing.length) throw new Error(`[iconSprite] ${page}: iconos inexistentes: ${missing.join(', ')}`);
  const symbols = [...names].sort().map((name) => {
    const [w, h, , , path] = ICONS.get(name);
    const d = Array.isArray(path) ? path.join(' ') : path;
    return `<symbol id="i-${name}" viewBox="0 0 ${w} ${h}"><path d="${d}"/></symbol>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true">${symbols.join('')}</svg>`;
}

/**
 * @param {{ root: string, pages: Record<string, string[]> }} options
 *   pages: por cada HTML (ruta relativa al proyecto), las carpetas/archivos JS que usa.
 */
export function iconSprite({ root, pages }) {
  return {
    name: 'motogo-icon-sprite',
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        const page = relative(root, ctx.filename).replaceAll('\\', '/');
        const sources = (pages[page] ?? []).flatMap((p) => {
          const full = join(root, p);
          return statSync(full).isDirectory() ? filesIn(full) : [full];
        });
        const names = collect([html, ...sources.map((f) => readFileSync(f, 'utf8'))]);
        return html.replace(/<body([^>]*)>/, (m) => `${m}\n  ${sprite(names, page)}`);
      },
    },
  };
}

/** @param {string[]} fontNames  fragmentos del nombre de archivo de las fuentes a precargar */
export function fontPreload(fontNames) {
  return {
    name: 'motogo-font-preload',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        const files = Object.keys(ctx.bundle ?? {}).filter((f) => f.endsWith('.woff2') && fontNames.some((n) => f.includes(n)));
        return files.map((file) => ({
          tag: 'link',
          attrs: { rel: 'preload', href: `/${file}`, as: 'font', type: 'font/woff2', crossorigin: '' },
          injectTo: 'head-prepend',
        }));
      },
    },
  };
}

/** @param {string[]} pages  HTML de salida en los que se incrusta el CSS (p. ej. ['index.html']) */
export function inlineCss(pages) {
  return {
    name: 'motogo-inline-css',
    apply: 'build',
    enforce: 'post',
    generateBundle(_, bundle) {
      for (const page of pages) {
        const html = bundle[page];
        if (!html || html.type !== 'asset') continue;
        let source = String(html.source);
        source = source.replace(/<link rel="stylesheet"(?: crossorigin)? href="\/([^"]+\.css)">/g, (tag, file) => {
          const css = bundle[file];
          return css ? `<style>${css.source}</style>` : tag;
        });
        html.source = source;
      }
    },
  };
}
