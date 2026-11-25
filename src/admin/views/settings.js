import { settingsApi } from '../../services/admin-api.js';
import { slugify } from '../../lib/utils.js';
import { esc, field, icon, invalid, toast } from '../ui.js';

const categoryRow = (c, used) => `
  <div class="flex items-center gap-2" data-category="${esc(c.id)}">
    <input class="input" value="${esc(c.label)}" aria-label="Nombre de la categoría" required>
    <span class="w-24 shrink-0 text-xs text-gray-500">${used} ${used === 1 ? 'moto' : 'motos'}</span>
    <button type="button" class="icon-btn icon-btn--danger shrink-0" data-remove-category title="${used ? 'Tiene motos: cámbialas de categoría antes de borrarla' : 'Eliminar categoría'}" aria-label="Eliminar categoría" ${used ? 'disabled' : ''}>
      ${icon('trash')}
    </button>
  </div>`;

export default {
  render(el, ctx) {
    const { contact, finance } = ctx.data.settings;
    const usage = (id) => ctx.data.bikes.filter((b) => b.category === id).length;

    el.innerHTML = `
      <div class="admin-toolbar">
        <div>
          <h1 class="heading-font text-4xl leading-none">Ajustes</h1>
          <p class="mt-1 text-sm text-gray-400">Contacto, calculadora y categorías del catálogo.</p>
        </div>
      </div>
      <form class="space-y-6" data-settings novalidate>
        <section class="form-section">
          <h2 class="heading-font mb-4 text-2xl">Contacto</h2>
          <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
            ${field({ label: 'Número de WhatsApp', name: 'whatsapp', value: contact.whatsapp, required: true, hint: 'Solo números, con código de país. Ej: 18095551234. Lo usan todos los botones de la web.', attrs: 'inputmode="numeric"' })}
            ${field({ label: 'Teléfono que se muestra', name: 'phoneDisplay', value: contact.phoneDisplay, placeholder: '+1 (809) 555-1234', hint: 'Aparece en el pie de la web. El botón «Llamar» usa el mismo número de WhatsApp.' })}
          </div>
        </section>

        <section class="form-section">
          <h2 class="heading-font mb-4 text-2xl">Calculadora de financiamiento</h2>
          <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
            ${field({ label: 'Tasa mensual (%)', name: 'monthlyRate', type: 'number', value: +(finance.monthlyRate * 100).toFixed(4), required: true, attrs: 'min="0" max="20" step="0.01"', hint: 'Ej: 1.8 = 1.8 % mensual.' })}
            ${field({ label: 'Plazos (meses)', name: 'terms', value: finance.terms.join(', '), required: true, hint: 'Separados por comas. Ej: 6, 12, 18, 24' })}
            ${field({ label: 'Precio mínimo (RD$)', name: 'priceMin', type: 'number', value: finance.price.min, attrs: 'min="0" step="1000"' })}
            ${field({ label: 'Precio máximo (RD$)', name: 'priceMax', type: 'number', value: finance.price.max, attrs: 'min="0" step="1000"' })}
            ${field({ label: 'Precio inicial mostrado (RD$)', name: 'priceDefault', type: 'number', value: finance.price.default, attrs: 'min="0" step="1000"' })}
            ${field({ label: 'Inicial por defecto (%)', name: 'downDefault', type: 'number', value: finance.downPayment.default, attrs: 'min="0" max="100" step="5"' })}
            ${field({ label: 'Inicial mínimo (%)', name: 'downMin', type: 'number', value: finance.downPayment.min, attrs: 'min="0" max="100" step="5"' })}
            ${field({ label: 'Inicial máximo (%)', name: 'downMax', type: 'number', value: finance.downPayment.max, attrs: 'min="0" max="100" step="5"' })}
          </div>
        </section>

        <section class="form-section">
          <h2 class="heading-font mb-1 text-2xl">Categorías del catálogo</h2>
          <p class="mb-4 text-xs text-gray-400">Son los botones de filtro de la web. Solo se muestran las que tienen motos publicadas.</p>
          <div class="space-y-2" data-categories>
            ${ctx.data.categories.map((c) => categoryRow(c, usage(c.id))).join('')}
          </div>
          <button type="button" class="btn-ghost mt-3 py-2 text-sm" data-add-category>${icon('plus')} Añadir categoría</button>
        </section>

        <div class="flex justify-end">
          <button type="submit" class="btn py-3 text-lg">${icon('check')} Guardar ajustes</button>
        </div>
      </form>`;

    const form = el.querySelector('[data-settings]');
    const categoriesEl = form.querySelector('[data-categories]');

    el.oninput = el.onchange = null;

    el.onclick = (e) => {
      if (e.target.closest('[data-add-category]')) {
        categoriesEl.insertAdjacentHTML('beforeend', categoryRow({ id: '', label: '' }, 0));
        categoriesEl.lastElementChild.querySelector('input').focus();
      }
      const remove = e.target.closest('[data-remove-category]');
      if (remove) remove.closest('[data-category]').remove();
    };

    form.onsubmit = async (e) => {
      e.preventDefault();
      const v = Object.fromEntries(new FormData(form));
      const num = (name) => Number(v[name]);

      const whatsapp = String(v.whatsapp).replace(/\D/g, '');
      if (whatsapp.length < 10 || whatsapp.length > 15) return invalid(form, 'whatsapp', 'El WhatsApp debe tener entre 10 y 15 dígitos, con código de país.');

      const rate = num('monthlyRate');
      if (!(rate >= 0 && rate <= 20)) return invalid(form, 'monthlyRate', 'La tasa debe estar entre 0 y 20 %.');

      const terms = [...new Set(String(v.terms).split(/[,\s]+/).map(Number).filter((n) => Number.isInteger(n) && n > 0))].sort((a, b) => a - b);
      if (!terms.length) return invalid(form, 'terms', 'Escribe al menos un plazo en meses. Ej: 12, 24');

      if (!(num('priceMin') < num('priceMax'))) return invalid(form, 'priceMax', 'El precio máximo debe ser mayor que el mínimo.');
      if (num('priceDefault') < num('priceMin') || num('priceDefault') > num('priceMax')) return invalid(form, 'priceDefault', 'El precio inicial debe estar entre el mínimo y el máximo.');
      if (!(num('downMin') < num('downMax'))) return invalid(form, 'downMax', 'El inicial máximo debe ser mayor que el mínimo.');
      if (num('downDefault') < num('downMin') || num('downDefault') > num('downMax')) return invalid(form, 'downDefault', 'El inicial por defecto debe estar entre el mínimo y el máximo.');

      // Categorías: se conservan los id existentes (las motos los usan); las nuevas reciben uno
      const categories = [];
      for (const rowEl of categoriesEl.querySelectorAll('[data-category]')) {
        const input = rowEl.querySelector('input');
        const label = input.value.trim();
        if (!label) {
          input.focus();
          return toast('Hay una categoría sin nombre.', 'error');
        }
        let id = rowEl.dataset.category;
        if (!id) {
          id = slugify(label);
          for (let n = 2; categories.some((c) => c.id === id) || ctx.data.categories.some((c) => c.id === id); n += 1) id = `${slugify(label)}-${n}`;
        }
        categories.push({ id, label });
      }
      if (!categories.length) return toast('Debe quedar al menos una categoría.', 'error');

      const button = form.querySelector('[type="submit"]');
      button.disabled = true;
      await ctx.run(async () => {
        await settingsApi.save({
          contact: { whatsapp, phoneDisplay: String(v.phoneDisplay).trim() },
          finance: {
            ...finance,
            monthlyRate: rate / 100,
            terms,
            defaultTerm: terms.includes(finance.defaultTerm) ? finance.defaultTerm : terms[0],
            price: { ...finance.price, min: num('priceMin'), max: num('priceMax'), default: num('priceDefault') },
            downPayment: { ...finance.downPayment, min: num('downMin'), max: num('downMax'), default: num('downDefault') },
          },
        });
        if (JSON.stringify(categories) !== JSON.stringify(ctx.data.categories)) await settingsApi.saveCategories(categories);
      }, 'Ajustes guardados');
      button.disabled = false;
    };
  },
};
