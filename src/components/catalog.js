import { BIKE_STATUS } from '../services/site-api.js';
import { $, $$, escapeHtml, formatMoney, icon, imageTag, normalize, whatsappUrl } from '../lib/utils.js';

const CARD_SIZES = '(min-width: 1280px) 400px, (min-width: 1024px) 31vw, (min-width: 640px) 48vw, 100vw';
// Cuántas motos se muestran de entrada (y en cada "Ver más"): 2 filas en móvil, 3 filas desde tablet
const pageSize = () => (window.matchMedia('(min-width: 640px)').matches ? 9 : 6);
const quoteMessage = (bike) => `Hola Motogo, deseo información y cotización sobre la ${bike.name}`;

function cardTemplate(bike, { showPrices }) {
  const status = bike.status !== 'disponible'
    ? `<span class="status-tag status-tag--${bike.status}">${BIKE_STATUS[bike.status]}</span>`
    : '';
  const price = showPrices
    ? `<p class="heading-font tabular mb-4 min-h-[1.5em] text-2xl text-brand">${bike.price ? formatMoney(bike.price) : ''}</p>`
    : '';

  return `
    <article class="bike-card card clip-corner" data-bike-id="${escapeHtml(bike.id)}">
      <div class="bike-card__media">
        ${imageTag({ src: bike.images[0], width: 640, alt: bike.name, sizes: CARD_SIZES })}
        ${bike.badge ? `<span class="badge absolute top-3 left-3">${escapeHtml(bike.badge)}</span>` : ''}
        ${status}
        <span class="bike-card__zoom">${icon('expand')} Ver en grande</span>
      </div>
      <div class="flex flex-1 flex-col p-5">
        <h3 class="heading-font text-2xl sm:text-3xl leading-tight text-white line-clamp-2 mb-2">${escapeHtml(bike.name)}</h3>
        <p class="text-sm leading-relaxed text-gray-400 line-clamp-2 mb-4">${escapeHtml(bike.description)}</p>
        <div class="mt-auto">
        ${price}
        <div class="grid grid-cols-2 gap-2">
          <button type="button" class="btn-ghost py-2.5 text-sm" data-action="open">Ver ficha</button>
          <a class="btn py-2.5 text-sm" href="${whatsappUrl(quoteMessage(bike))}" target="_blank" rel="noopener">
            ${icon('whatsapp')} Cotizar
          </a>
        </div>
        </div>
      </div>
    </article>`;
}

/**
 * Catálogo con filtro por categoría y búsqueda.
 * Los listeners se crean una vez; setData() repinta cuando llegan datos nuevos.
 */
export function createCatalog({ onOpen }) {
  const grid = $('#catalog-grid');
  const filters = $('#catalog-filters');
  const search = $('#search-input');
  const count = $('#catalog-count');
  const more = $('#catalog-more');

  const state = { category: 'all', query: '', published: [], visible: [], showPrices: false, limit: pageSize() };

  // El catálogo está lejos del inicio: se pinta cuando el visitante se acerca (o enlaza a él).
  // Así la carga inicial no bloquea el procesador pintando decenas de cards que aún no se ven.
  let near = !('IntersectionObserver' in window);
  let hasData = false;
  if (!near) {
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      observer.disconnect();
      near = true;
      if (hasData) render();
    }, { rootMargin: '800px 0px' });
    observer.observe(grid);
  }

  function render() {
    if (!near) return;
    const q = normalize(state.query);
    state.visible = state.published.filter(
      (b) =>
        (state.category === 'all' || b.category === state.category) &&
        (!q || normalize(`${b.name} ${b.description} ${b.badge}`).includes(q)),
    );

    $$('[data-cat]', filters).forEach((btn) =>
      btn.setAttribute('aria-pressed', String(btn.dataset.cat === state.category)),
    );

    const total = state.visible.length;
    const shown = Math.min(state.limit, total);
    count.textContent = total === 0 ? '' : shown < total
      ? `Mostrando ${shown} de ${total} modelos`
      : `${total} ${total === 1 ? 'modelo' : 'modelos'}`;
    grid.removeAttribute('aria-busy');
    grid.innerHTML = total
      ? state.visible.slice(0, shown).map((b) => cardTemplate(b, { showPrices: state.showPrices })).join('')
      : `<div class="col-span-full border-2 border-dashed border-dark-border px-6 py-14 text-center">
           <p class="heading-font mb-2 text-2xl text-white">Sin resultados</p>
           <p class="mb-6 text-sm text-gray-400">No encontramos modelos con esa búsqueda. Prueba otra marca o escríbenos y te ayudamos.</p>
           <button type="button" class="btn-ghost px-6 py-3" data-action="reset">Ver todos los modelos</button>
         </div>`;

    const rest = total - shown;
    more.hidden = rest <= 0;
    more.textContent = `Ver más modelos (${rest})`;
  }

  /** Vuelve a la primera página al cambiar filtro o búsqueda. */
  function resetPage() {
    state.limit = pageSize();
  }

  function setData({ bikes, categories }) {
    state.published = bikes.filter((b) => b.published);
    state.showPrices = state.published.some((b) => b.price);
    // Solo se muestran las categorías que tienen motos publicadas
    const tabs = [{ id: 'all', label: 'Todas' }, ...categories.filter((c) => state.published.some((b) => b.category === c.id))];
    if (!tabs.some((t) => t.id === state.category)) state.category = 'all';
    filters.innerHTML = tabs
      .map((c) => `<button type="button" class="chip" data-cat="${escapeHtml(c.id)}" aria-pressed="false">${escapeHtml(c.label)}</button>`)
      .join('');
    hasData = true;
    state.visible = state.published; // disponible para la ficha aunque aún no se haya pintado
    render();
  }

  function showError(contactUrl) {
    grid.removeAttribute('aria-busy');
    count.textContent = '';
    grid.innerHTML = `
      <div class="col-span-full border-2 border-dashed border-dark-border p-10 text-center">
        <p class="mb-4 font-bold text-gray-300">No pudimos cargar el catálogo en este momento.</p>
        <a class="btn px-6 py-3" href="${contactUrl}" target="_blank" rel="noopener">${icon('whatsapp')} Pedir el catálogo por WhatsApp</a>
      </div>`;
  }

  filters.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-cat]');
    if (!btn) return;
    state.category = btn.dataset.cat;
    resetPage();
    render();
  });

  search.addEventListener('input', () => {
    state.query = search.value;
    resetPage();
    render();
  });

  // Toda la card abre la ficha, salvo el enlace de WhatsApp
  more.addEventListener('click', () => {
    const firstNew = state.limit;
    state.limit += pageSize();
    render();
    // El teclado sigue en el primer modelo nuevo, no vuelve arriba
    $$('[data-bike-id]', grid)[firstNew]?.querySelector('[data-action="open"]')?.focus({ preventScroll: true });
  });

  grid.addEventListener('click', (e) => {
    if (e.target.closest('[data-action="reset"]')) {
      state.category = 'all';
      state.query = search.value = '';
      resetPage();
      render();
      return;
    }
    if (e.target.closest('a')) return;
    const card = e.target.closest('[data-bike-id]');
    if (card) onOpen(card.dataset.bikeId);
  });

  return { setData, showError, getVisible: () => state.visible };
}
