import { $, $$, escapeHtml, formatDate, icon, imageTag, offerStatus, whatsappUrl } from '../lib/utils.js';

const SIZES = '(min-width: 1024px) 400px, (min-width: 768px) 50vw, 100vw';

const template = (offer) => `
  <article class="card clip-corner flex flex-col overflow-hidden">
    <div class="relative aspect-[16/9] shrink-0 overflow-hidden bg-dark-surface">
      ${imageTag({ src: offer.image, width: 640, alt: offer.title, sizes: SIZES, className: 'h-full w-full object-cover' })}
      ${offer.tag ? `<span class="badge absolute top-3 left-3">${escapeHtml(offer.tag)}</span>` : ''}
    </div>
    <div class="flex flex-1 flex-col p-6">
      <h3 class="heading-font mb-2 text-3xl leading-tight text-white">${escapeHtml(offer.title)}</h3>
      <p class="mb-4 whitespace-pre-line text-sm leading-relaxed text-gray-300">${escapeHtml(offer.description)}</p>
      ${offer.endsAt ? `<p class="mb-5 text-xs font-bold uppercase tracking-widest text-brand">Válida hasta el ${escapeHtml(formatDate(offer.endsAt))}</p>` : ''}
      <a class="btn mt-auto py-3 text-base" href="${whatsappUrl(offer.waMessage || `Hola Motogo, me interesa la oferta: ${offer.title}`)}" target="_blank" rel="noopener">
        ${icon('whatsapp')} ${escapeHtml(offer.buttonText || 'Aprovechar oferta')}
      </a>
    </div>
  </article>`;

/** Muestra las ofertas vigentes. Sin ofertas, la sección y su enlace del menú no aparecen. */
export function renderOffers(offers) {
  const live = offers.filter((o) => offerStatus(o) === 'live');
  $('#ofertas').hidden = live.length === 0;
  $$('[data-nav="ofertas"]').forEach((link) => { link.hidden = live.length === 0; });
  $('#offers-grid').innerHTML = live.map(template).join('');
}
