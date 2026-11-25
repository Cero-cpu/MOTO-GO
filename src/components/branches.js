import { $, $$, branchText, escapeHtml, icon, whatsappUrl } from '../lib/utils.js';

const template = (branch) => `
  <article class="card clip-corner flex flex-col bg-dark p-8">
    <span class="mb-6 flex h-12 w-12 items-center justify-center bg-brand text-xl text-black" aria-hidden="true">${icon('location-dot')}</span>
    <h3 class="heading-font mb-1 text-4xl leading-none text-white">${escapeHtml(branch.name)}</h3>
    ${branch.tag ? `<p class="mb-4 text-xs font-bold uppercase tracking-widest text-brand">${escapeHtml(branch.tag)}</p>` : '<div class="mb-4"></div>'}
    <p class="mb-8 text-sm leading-relaxed text-gray-400">${escapeHtml(branch.description)}</p>
    <a class="btn mt-auto whitespace-nowrap py-3 text-base"
       href="${whatsappUrl(`Hola Motogo, deseo contactar con la sucursal de ${branch.fullName || branch.name}.`)}"
       target="_blank" rel="noopener" aria-label="Contactar sucursal ${escapeHtml(branch.name)} por WhatsApp">
      ${icon('whatsapp')} Contactar
    </a>
  </article>`;

const footerItem = (branch) => `
  <li>
    <a class="group block" href="${whatsappUrl(`Hola Motogo, deseo contactar con la sucursal de ${branch.fullName || branch.name}.`)}" target="_blank" rel="noopener">
      <span class="font-bold text-white transition-colors group-hover:text-brand">${escapeHtml(branch.name)}</span>
      ${branch.tag ? `<span class="block text-xs">${escapeHtml(branch.tag)}</span>` : ''}
    </a>
  </li>`;

/** Tarjetas de sucursales + textos de la página que nombran las sucursales. */
export function renderBranches(branches) {
  $('#branches-grid').innerHTML = branches.map(template).join('');
  const footerList = $('#footer-branches');
  if (footerList) footerList.innerHTML = branches.map(footerItem).join('');

  // <span data-branches="short|long|sentence|sentenceLong">: el HTML trae el texto escrito
  // (para buscadores) y aquí se sincroniza con la base de datos.
  const texts = branchText(branches);
  $$('[data-branches]').forEach((el) => {
    const text = texts[el.dataset.branches];
    if (text) el.textContent = text;
  });
}
