import { media, offersApi } from '../../services/admin-api.js';
import { $, formatDate, imageSrc, normalize, offerStatus, todayISO } from '../../lib/utils.js';
import { confirmAction, emptyState, esc, field, icon, invalid, mountPhotoManager, openDrawer, textarea, toggle } from '../ui.js';

const STATUS_LABEL = { live: 'En la web', scheduled: 'Programada', expired: 'Vencida', off: 'Desactivada' };
const filter = { q: '', status: 'all' };

function dates(offer) {
  if (offer.startsAt && offer.endsAt) return `Del ${formatDate(offer.startsAt)} al ${formatDate(offer.endsAt)}`;
  if (offer.endsAt) return `Hasta el ${formatDate(offer.endsAt)}`;
  if (offer.startsAt) return `Desde el ${formatDate(offer.startsAt)}`;
  return 'Sin fecha de fin';
}

function row(offer) {
  const status = offerStatus(offer);
  return `
    <article class="admin-row ${status === 'live' ? '' : 'is-hidden'}" data-id="${esc(offer.id)}">
      <img class="admin-row__thumb ${offer.image ? '' : 'img-fallback'}" src="${esc(imageSrc(offer.image, 200))}" alt="" data-fallback loading="lazy" decoding="async">
      <div class="admin-row__info">
        <p class="truncate font-bold text-white">${esc(offer.title)}</p>
        <p class="truncate text-xs text-gray-400">${esc(dates(offer))}</p>
      </div>
      <div class="admin-row__meta">
        <span class="pill pill--${status}">${STATUS_LABEL[status]}</span>
        ${toggle({ label: offer.active ? 'Activa' : 'Inactiva', name: 'active', checked: offer.active, attrs: 'data-action="toggle"' })}
      </div>
      <div class="admin-row__actions">
        <button type="button" class="icon-btn" data-action="edit" title="Editar" aria-label="Editar ${esc(offer.title)}">${icon('pen')}</button>
        <button type="button" class="icon-btn icon-btn--danger" data-action="delete" title="Eliminar" aria-label="Eliminar ${esc(offer.title)}">${icon('trash')}</button>
      </div>
    </article>`;
}

function openForm(ctx, offer) {
  const isNew = !offer;
  const draft = structuredClone(offer ?? {
    id: crypto.randomUUID(), title: '', tag: '', description: '', image: null,
    buttonText: '', waMessage: '', startsAt: todayISO(), endsAt: '', active: true,
  });
  const images = draft.image ? [draft.image] : [];
  let uploaded = new Set();

  const body = `
    ${field({ label: 'Título de la oferta', name: 'title', value: draft.title, required: true, placeholder: 'Ej: Inicial desde RD$ 10,000', full: true })}
    ${field({ label: 'Etiqueta', name: 'tag', value: draft.tag, placeholder: 'Ej: Solo este mes', hint: 'Sale sobre la imagen. Opcional.', attrs: 'maxlength="28"' })}
    ${field({ label: 'Texto del botón', name: 'buttonText', value: draft.buttonText, placeholder: 'Aprovechar oferta' })}
    ${textarea({ label: 'Descripción', name: 'description', value: draft.description, rows: 3, placeholder: 'Condiciones, modelos incluidos...' })}
    ${field({ label: 'Empieza', name: 'startsAt', type: 'date', value: draft.startsAt, hint: 'Vacío = desde ya' })}
    ${field({ label: 'Termina', name: 'endsAt', type: 'date', value: draft.endsAt, hint: 'Vacío = sin fecha de fin. Se quita sola al vencer.' })}
    ${textarea({ label: 'Mensaje de WhatsApp', name: 'waMessage', value: draft.waMessage, rows: 2, placeholder: 'Hola Motogo, me interesa la oferta...', hint: 'Lo que le llega al asesor cuando el cliente toca el botón. Vacío = se genera con el título.' })}
    <fieldset class="sm:col-span-2">
      <legend class="field__label mb-3">Imagen</legend>
      <div class="photo-grid" data-photos></div>
    </fieldset>
    <div class="sm:col-span-2">${toggle({ label: 'Activa', name: 'active', checked: draft.active })}</div>`;

  openDrawer({
    title: isNew ? 'Nueva oferta' : 'Editar oferta',
    submitLabel: isNew ? 'Crear oferta' : 'Guardar cambios',
    body,
    onReady(form, { markDirty, setBusy }) {
      uploaded = mountPhotoManager($('[data-photos]', form), images, {
        max: 1,
        upload: (file) => media.upload(file, `offers/${draft.id}`),
        onChange: markDirty,
        onBusy: setBusy,
      });
    },
    async onSubmit(form) {
      const data = new FormData(form);
      const title = data.get('title').trim();
      if (!title) return invalid(form, 'title', 'Escribe el título de la oferta.');
      const startsAt = data.get('startsAt');
      const endsAt = data.get('endsAt');
      if (startsAt && endsAt && endsAt < startsAt) return invalid(form, 'endsAt', 'La fecha de fin es anterior a la de inicio.');

      const ok = await ctx.run(() => offersApi.save({
        ...draft,
        title,
        tag: data.get('tag').trim(),
        buttonText: data.get('buttonText').trim(),
        description: data.get('description').trim(),
        waMessage: data.get('waMessage').trim(),
        startsAt,
        endsAt,
        image: images[0] ?? null,
        active: form.elements.active.checked,
      }), isNew ? 'Oferta creada' : 'Oferta actualizada');

      if (ok && draft.image && draft.image !== images[0]) media.remove([draft.image]);
      return ok;
    },
    onClose(saved) {
      if (!saved) media.remove([...uploaded]);
    },
  });
}

export default {
  render(el, ctx) {
    const { offers } = ctx.data;
    const live = offers.filter((o) => offerStatus(o) === 'live').length;

    el.innerHTML = `
      <div class="admin-toolbar">
        <div>
          <h1 class="heading-font text-4xl leading-none">Ofertas</h1>
          <p class="mt-1 text-sm text-gray-400">${live} en la web ahora. Se publican y se quitan solas según sus fechas.</p>
        </div>
        <button type="button" class="btn py-3 text-lg" data-action="new">${icon('plus')} Nueva oferta</button>
      </div>
      <div class="admin-search admin-search--compact mb-3">
        <label class="admin-search__box">
          ${icon('magnifying-glass')}
          <input class="input" type="search" placeholder="Buscar oferta…  (atajo: /)" value="${esc(filter.q)}" data-filter="q" data-search aria-label="Buscar ofertas" autocomplete="off">
        </label>
        <select class="input" data-filter="status" aria-label="Estado">
          <option value="all">Todos los estados</option>
          ${Object.entries(STATUS_LABEL).map(([value, label]) => `<option value="${value}">${label}</option>`).join('')}
        </select>
      </div>
      <p class="mb-4 min-h-[1.25rem] text-sm text-gray-400" data-result-count aria-live="polite"></p>
      <div class="space-y-3" data-list></div>`;

    $('select[data-filter="status"]', el).value = filter.status;
    const listEl = $('[data-list]', el);
    const renderList = () => {
      const q = normalize(filter.q);
      const list = offers.filter((o) =>
        (filter.status === 'all' || offerStatus(o) === filter.status) &&
        (!q || q.split(/\s+/).every((w) => normalize(`${o.title} ${o.tag} ${o.description}`).includes(w))));
      const filtered = filter.q || filter.status !== 'all';
      $('[data-result-count]', el).textContent = offers.length ? (filtered ? `${list.length} de ${offers.length} ofertas` : `${offers.length} ofertas`) : '';
      listEl.innerHTML = list.length
        ? list.map(row).join('')
        : emptyState(offers.length ? 'Ninguna oferta coincide con la búsqueda.' : 'No hay ofertas. Cuando crees una, aparecerá en la web con su propia sección.');
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
      const offer = offers.find((o) => o.id === e.target.closest('[data-id]').dataset.id);
      const active = e.target.checked;
      ctx.run(() => offersApi.setActive(offer.id, active), active ? 'Oferta activada' : 'Oferta desactivada');
    };

    el.onclick = (e) => {
      const action = e.target.closest('button[data-action]')?.dataset.action;
      if (!action) return;
      if (action === 'new') return openForm(ctx);

      const offer = offers.find((o) => o.id === e.target.closest('[data-id]')?.dataset.id);
      if (!offer) return;
      if (action === 'edit') openForm(ctx, offer);
      if (action === 'delete' && confirmAction(`¿Eliminar la oferta «${offer.title}»?`)) {
        ctx.run(() => offersApi.remove(offer), 'Oferta eliminada');
      }
    };
  },
};
