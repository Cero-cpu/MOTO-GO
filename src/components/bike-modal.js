import { BIKE_STATUS } from '../services/site-api.js';
import { $, $$, branchText, escapeHtml, formatMoney, icon, imageSrc, imageSrcset, imageTag, whatsappUrl } from '../lib/utils.js';

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
const SWIPE_THRESHOLD = 60;
const PHOTO_SIZES = '(min-width: 768px) 60vw, 100vw';

/**
 * Vista en grande de una moto, con galería y navegación entre los modelos visibles.
 */
export function createBikeModal({ getList, onCalculate }) {
  const root = $('#bike-modal');
  const dialog = $('.modal__dialog', root);
  const body = $('#bike-modal-body', root);

  let data = { bikes: [], categories: [], branches: [], settings: { finance: { terms: [] } } };
  let current = null;
  let lastFocus = null;
  let touchStart = null;

  const categoryLabel = (id) => data.categories.find((c) => c.id === id)?.label ?? '';

  function availability(bike) {
    const selected = data.branches.filter((b) => bike.branches.includes(b.id));
    return branchText(selected.length ? selected : data.branches).short;
  }

  function template(bike, position, total) {
    const facts = [
      bike.price && ['Precio', formatMoney(bike.price), true],
      bike.status !== 'disponible' && ['Estado', BIKE_STATUS[bike.status], true],
      ['Disponibilidad', availability(bike), !bike.price],
      ['Garantía', 'Oficial Motogo'],
      ['Financiamiento', 'Aprobación en horas'],
      ['Planes', `${data.settings.finance.terms.join(' • ')} meses`],
    ].filter(Boolean);

    const thumbs = bike.images.length > 1
      ? `<div class="flex gap-2 overflow-x-auto bg-black p-2" role="group" aria-label="Fotos">
          ${bike.images.map((src, i) => `
            <button type="button" class="gallery-thumb" data-action="photo" data-index="${i}" aria-label="Foto ${i + 1}" aria-current="${i === 0}">
              <img src="${escapeHtml(imageSrc(src, 200))}" alt="" data-fallback loading="lazy" decoding="async">
            </button>`).join('')}
        </div>`
      : '';

    return `
      <div class="grid grid-cols-1 md:grid-cols-5">
        <div class="flex flex-col bg-black md:col-span-3">
          <div class="relative flex-1">
            ${imageTag({ src: bike.images[0], width: 1600, alt: bike.name, sizes: PHOTO_SIZES, lazy: false, className: 'h-full w-full max-h-[50vh] object-cover md:max-h-none md:min-h-[480px]', attrs: 'data-main-photo' })}
            ${bike.badge ? `<span class="badge badge--lg absolute top-4 left-4">${escapeHtml(bike.badge)}</span>` : ''}
            <span class="absolute bottom-4 left-4 bg-black/75 px-3 py-1.5 text-xs font-bold text-white">${position} / ${total}</span>
          </div>
          ${thumbs}
        </div>
        <div class="flex flex-col p-6 sm:p-8 md:col-span-2">
          <span class="eyebrow mb-2">${escapeHtml(categoryLabel(bike.category))}</span>
          <h3 id="bike-modal-title" class="heading-font mb-4 pr-12 text-4xl leading-none text-white sm:text-5xl">${escapeHtml(bike.name)}</h3>
          <p class="mb-6 whitespace-pre-line text-base leading-relaxed text-gray-300">${escapeHtml(bike.description)}</p>
          <dl class="mb-6 space-y-3 border-y-2 border-dark-border py-5 text-sm font-bold">
            ${facts.map(([label, value, highlight]) => `
              <div class="flex justify-between gap-4">
                <dt class="text-gray-400">${escapeHtml(label)}</dt>
                <dd class="text-right ${highlight ? 'text-brand' : 'text-white'}">${escapeHtml(value)}</dd>
              </div>`).join('')}
          </dl>
          <div class="mt-auto space-y-3">
            <a class="btn w-full py-3.5 text-lg" href="${whatsappUrl(`Hola Motogo, deseo información y cotización sobre la ${bike.name}`)}" target="_blank" rel="noopener">
              ${icon('whatsapp', 'text-xl')} Cotizar por WhatsApp
            </a>
            <a class="btn-ghost w-full py-3 text-lg" href="#calculadora" data-action="calculate">
              ${icon('calculator', 'text-brand')} ${bike.price ? 'Calcular cuota de esta moto' : 'Calcular mi cuota'}
            </a>
            <div class="grid grid-cols-2 gap-3 xl:hidden">
              <button type="button" class="btn-ghost py-3" data-action="prev">${icon('chevron-left')} Anterior</button>
              <button type="button" class="btn-ghost py-3" data-action="next">Siguiente ${icon('chevron-right')}</button>
            </div>
          </div>
        </div>
      </div>`;
  }

  const isOpen = () => current !== null;

  function show(id) {
    const list = getList();
    const bike = data.bikes.find((b) => b.id === id);
    if (!bike) return;
    current = bike;
    body.innerHTML = template(bike, list.findIndex((b) => b.id === id) + 1, list.length);
    dialog.scrollTop = 0;
  }

  function open(id) {
    lastFocus = document.activeElement;
    show(id);
    root.classList.add('is-open');
    document.body.classList.add('no-scroll');
    $('.modal__close', root).focus();
  }

  function close() {
    root.classList.remove('is-open');
    document.body.classList.remove('no-scroll');
    current = null;
    lastFocus?.focus?.({ preventScroll: true });
  }

  function step(direction) {
    const list = getList();
    if (!list.length) return;
    const index = list.findIndex((b) => b.id === current.id);
    show(list[(index + direction + list.length) % list.length].id);
  }

  function showPhoto(index) {
    const img = $('[data-main-photo]', root);
    const src = current.images[index];
    img.srcset = imageSrcset(src);
    img.src = imageSrc(src, 1600);
    $$('[data-action="photo"]', root).forEach((t, i) => t.setAttribute('aria-current', String(i === index)));
  }

  root.addEventListener('click', (e) => {
    const target = e.target.closest('[data-action]');
    const action = target?.dataset.action;
    if (action === 'close') close();
    else if (action === 'prev') step(-1);
    else if (action === 'next') step(1);
    else if (action === 'photo') showPhoto(Number(target.dataset.index));
    else if (action === 'calculate') {
      const { price } = current;
      close();
      if (price) onCalculate?.(price);
    } else if (e.target === root) close(); // clic en el fondo oscuro
  });

  document.addEventListener('keydown', (e) => {
    if (!isOpen()) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowRight') step(1);
    else if (e.key === 'ArrowLeft') step(-1);
    else if (e.key === 'Tab') trapFocus(e);
  });

  // Mantiene el foco dentro de la ventana
  function trapFocus(e) {
    const items = $$(FOCUSABLE, root).filter((el) => el.offsetParent !== null);
    if (!items.length) return;
    const first = items[0];
    const last = items.at(-1);
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  // Deslizar horizontalmente en móvil cambia de modelo (sin interferir con el scroll vertical)
  root.addEventListener('touchstart', (e) => {
    if (e.target.closest('.gallery-thumb')) return; // la tira de fotos tiene su propio scroll
    touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, { passive: true });
  root.addEventListener('touchend', (e) => {
    if (!touchStart) return;
    const dx = e.changedTouches[0].clientX - touchStart.x;
    const dy = e.changedTouches[0].clientY - touchStart.y;
    if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) step(dx < 0 ? 1 : -1);
    touchStart = null;
  });

  return {
    open,
    setData(next) {
      data = next;
      // Si la ficha abierta cambió (o desapareció), se actualiza
      if (current) {
        const updated = data.bikes.find((b) => b.id === current.id && b.published);
        if (updated) show(updated.id);
        else close();
      }
    },
  };
}
