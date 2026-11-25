/**
 * Piezas de interfaz reutilizables del panel: campos, formulario en ventana, avisos y gestor de fotos.
 */
import { $, escapeHtml as esc, icon, imageSrc } from '../lib/utils.js';

export { esc, icon };

/* ---------- Avisos ---------- */
export function toast(message, type = 'ok') {
  const el = document.createElement('div');
  el.className = `toast toast--${type}`;
  el.setAttribute('role', type === 'error' ? 'alert' : 'status');
  el.textContent = message;
  $('#toasts').append(el);
  setTimeout(() => el.remove(), type === 'error' ? 6000 : 3000);
}

export const confirmAction = (message) => window.confirm(message);

export const emptyState = (text) => `<p class="empty-state">${esc(text)}</p>`;

/* ---------- Campos ---------- */
const span = (full) => (full ? 'sm:col-span-2' : '');
const hintHtml = (hint) => (hint ? `<span class="field__hint">${esc(hint)}</span>` : '');
const labelHtml = (label, required) => `<span class="field__label">${esc(label)}${required ? ' <b class="text-brand" aria-hidden="true">*</b>' : ''}</span>`;

export function field({ label, name, value = '', type = 'text', required = false, placeholder = '', hint = '', attrs = '', full = false }) {
  return `
    <label class="field ${span(full)}">
      ${labelHtml(label, required)}
      <input class="input" type="${type}" name="${name}" value="${esc(value ?? '')}" placeholder="${esc(placeholder)}" ${required ? 'required' : ''} ${attrs}>
      ${hintHtml(hint)}
    </label>`;
}

export function textarea({ label, name, value = '', rows = 4, hint = '', placeholder = '', full = true }) {
  return `
    <label class="field ${span(full)}">
      ${labelHtml(label)}
      <textarea class="input" name="${name}" rows="${rows}" placeholder="${esc(placeholder)}">${esc(value ?? '')}</textarea>
      ${hintHtml(hint)}
    </label>`;
}

export function select({ label, name, value, options, hint = '', full = false }) {
  return `
    <label class="field ${span(full)}">
      ${labelHtml(label)}
      <select class="input" name="${name}">
        ${options.map((o) => `<option value="${esc(o.value)}" ${String(o.value) === String(value) ? 'selected' : ''}>${esc(o.label)}</option>`).join('')}
      </select>
      ${hintHtml(hint)}
    </label>`;
}

export function toggle({ label, name, checked, attrs = '' }) {
  return `
    <label class="switch">
      <input type="checkbox" name="${name}" ${checked ? 'checked' : ''} ${attrs}>
      <span class="switch__track" aria-hidden="true"></span>
      ${esc(label)}
    </label>`;
}

/** Marca un campo como inválido, lo enfoca y muestra el motivo. Devuelve false para cortar el guardado. */
export function invalid(form, name, message) {
  const input = form.elements[name];
  input?.setAttribute('aria-invalid', 'true');
  input?.focus();
  input?.addEventListener('input', () => input.removeAttribute('aria-invalid'), { once: true });
  toast(message, 'error');
  return false;
}

/* ---------- Formulario en ventana ---------- */
let closeCurrent = null;

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && closeCurrent) closeCurrent();
});

/**
 * Abre un formulario en ventana.
 * - onSubmit(form): devuelve false si hay errores (la ventana no se cierra).
 * - onClose(saved): se llama al cerrar, indicando si se guardó (para limpiar fotos subidas y no usadas).
 */
export function openDrawer({ title, body, submitLabel = 'Guardar', onSubmit, onReady, onClose }) {
  const root = $('#drawer');
  const form = $('#drawer-form');
  let dirty = false;
  let busy = false;

  form.innerHTML = `
    <div class="drawer__head">
      <h2 id="drawer-title" class="heading-font text-3xl leading-none">${esc(title)}</h2>
      <button type="button" class="modal__close" data-close aria-label="Cerrar">${icon('xmark')}</button>
    </div>
    <div class="drawer__body grid grid-cols-1 gap-5 sm:grid-cols-2">${body}</div>
    <div class="drawer__foot">
      <button type="button" class="btn-ghost py-3" data-close>Cancelar</button>
      <button type="submit" class="btn py-3">${icon('check')} ${esc(submitLabel)}</button>
    </div>`;

  const close = (saved = false) => {
    if (busy) return;
    if (!saved && dirty && !confirmAction('Hay cambios sin guardar. ¿Cerrar de todos modos?')) return;
    root.classList.remove('is-open');
    document.body.classList.remove('no-scroll');
    closeCurrent = null;
    onClose?.(saved);
  };

  form.oninput = form.onchange = () => { dirty = true; };
  form.onclick = (e) => { if (e.target.closest('[data-close]')) close(); };
  root.onclick = (e) => { if (e.target === root) close(); };
  form.onsubmit = async (e) => {
    e.preventDefault();
    if (busy) return;
    const button = form.querySelector('[type="submit"]');
    busy = true;
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    try {
      const ok = (await onSubmit(form)) !== false;
      busy = false;
      if (ok) close(true);
    } finally {
      busy = false;
      button.disabled = false;
      button.removeAttribute('aria-busy');
    }
  };

  closeCurrent = () => close();
  root.classList.add('is-open');
  document.body.classList.add('no-scroll');
  $('.modal__dialog', root).scrollTop = 0;
  onReady?.(form, {
    markDirty: () => { dirty = true; },
    setBusy: (value) => { busy = value; form.querySelector('[type="submit"]').disabled = value; },
  });
  form.querySelector('input:not([type="file"]):not([type="checkbox"]), textarea, select')?.focus();
}

/* ---------- Gestor de fotos ---------- */

/**
 * Lista de fotos editable: subir (clic o arrastrar), elegir portada y quitar.
 * Las fotos se suben al momento con `upload(file)` (que devuelve su clave); `images` se modifica en el sitio.
 * Devuelve el conjunto de claves subidas en esta sesión (para borrarlas si se cancela).
 */
export function mountPhotoManager(container, images, { max = 12, upload, onChange, onBusy } = {}) {
  const uploaded = new Set();
  let pending = 0;

  const render = () => {
    const tiles = images.map((key, i) => `
      <figure class="photo">
        <img src="${esc(imageSrc(key, 640))}" alt="Foto ${i + 1}" data-fallback decoding="async">
        ${i === 0
          ? `<span class="photo__cover">${max === 1 ? 'Imagen' : 'Portada'}</span>`
          : `<button type="button" class="photo__btn photo__btn--left" data-cover="${i}" title="Usar como portada" aria-label="Usar como portada">${icon('star')}</button>`}
        <button type="button" class="photo__btn" data-remove="${i}" title="Quitar foto" aria-label="Quitar foto ${i + 1}">${icon('xmark')}</button>
      </figure>`);

    for (let i = 0; i < pending; i += 1) tiles.push('<div class="photo photo--loading" aria-label="Subiendo foto…"></div>');

    if (images.length + pending < max) {
      tiles.push(`
        <label class="photo-add">
          ${icon('camera')}
          <span>${images.length ? 'Añadir' : 'Subir'} ${max === 1 ? 'imagen' : 'fotos'}<br><span class="font-normal">o arrastrar aquí</span></span>
          <input type="file" accept="image/*" ${max > 1 ? 'multiple' : ''} class="sr-only" data-upload>
        </label>`);
    }
    container.innerHTML = tiles.join('');
  };

  async function addFiles(fileList) {
    const files = [...fileList].filter((f) => f.type.startsWith('image/'));
    const room = max - images.length - pending;
    if (files.length > room) toast(`Máximo ${max} ${max === 1 ? 'imagen' : 'fotos'}.`, 'error');
    const selected = files.slice(0, Math.max(0, room));
    if (!selected.length) return;

    pending += selected.length;
    onBusy?.(true);
    render();
    await Promise.all(selected.map(async (file) => {
      try {
        const key = await upload(file);
        uploaded.add(key);
        images.push(key);
      } catch (error) {
        toast(`${file.name}: ${error.message}`, 'error');
      } finally {
        pending -= 1;
      }
    }));
    onBusy?.(false);
    render();
    onChange?.();
  }

  container.onclick = (e) => {
    const cover = e.target.closest('[data-cover]');
    const remove = e.target.closest('[data-remove]');
    if (cover) images.unshift(...images.splice(Number(cover.dataset.cover), 1));
    else if (remove) images.splice(Number(remove.dataset.remove), 1);
    else return;
    render();
    onChange?.();
  };

  container.onchange = (e) => {
    if (!e.target.matches('[data-upload]')) return;
    e.stopPropagation();
    addFiles(e.target.files);
  };

  container.ondragover = (e) => {
    e.preventDefault();
    container.querySelector('.photo-add')?.classList.add('is-dragging');
  };
  container.ondragleave = () => container.querySelector('.photo-add')?.classList.remove('is-dragging');
  container.ondrop = (e) => {
    e.preventDefault();
    container.querySelector('.photo-add')?.classList.remove('is-dragging');
    addFiles(e.dataTransfer.files);
  };

  render();
  return uploaded;
}
