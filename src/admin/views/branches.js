import { branchesApi } from '../../services/admin-api.js';
import { slugify } from '../../lib/utils.js';
import { confirmAction, emptyState, esc, field, icon, invalid, openDrawer, textarea } from '../ui.js';

function row(branch, index, total) {
  return `
    <article class="admin-row" data-id="${esc(branch.id)}">
      <span class="admin-row__thumb flex items-center justify-center bg-brand heading-font text-2xl text-black">${String(index + 1).padStart(2, '0')}</span>
      <div class="admin-row__info">
        <p class="truncate font-bold text-white">${esc(branch.name)}</p>
        <p class="truncate text-xs text-gray-400">${esc(branch.tag || '—')} · ${esc(branch.description)}</p>
      </div>
      <div class="admin-row__meta">
        <button type="button" class="icon-btn" data-action="up" title="Subir" aria-label="Subir ${esc(branch.name)}" ${index === 0 ? 'disabled' : ''}>${icon('arrow-up')}</button>
        <button type="button" class="icon-btn" data-action="down" title="Bajar" aria-label="Bajar ${esc(branch.name)}" ${index === total - 1 ? 'disabled' : ''}>${icon('arrow-down')}</button>
      </div>
      <div class="admin-row__actions">
        <button type="button" class="icon-btn" data-action="edit" title="Editar" aria-label="Editar ${esc(branch.name)}">${icon('pen')}</button>
        <button type="button" class="icon-btn icon-btn--danger" data-action="delete" title="Eliminar" aria-label="Eliminar ${esc(branch.name)}">${icon('trash')}</button>
      </div>
    </article>`;
}

function openForm(ctx, branch) {
  const isNew = !branch;
  const draft = branch ?? { id: '', name: '', short: '', fullName: '', tag: '', description: '' };

  const body = `
    ${field({ label: 'Nombre', name: 'name', value: draft.name, required: true, placeholder: 'Ej: Santiago', hint: 'Título de la tarjeta de la sucursal.' })}
    ${field({ label: 'Nombre corto', name: 'short', value: draft.short, placeholder: 'Ej: SFM', hint: 'Para listas como «La Vega • Bonao • SFM». Vacío = el nombre.' })}
    ${field({ label: 'Nombre completo', name: 'fullName', value: draft.fullName, placeholder: 'Ej: San Francisco de Macorís', hint: 'Solo si el nombre es una abreviatura.' })}
    ${field({ label: 'Subtítulo', name: 'tag', value: draft.tag, placeholder: 'Ej: Provincia Santiago' })}
    ${textarea({ label: 'Descripción', name: 'description', value: draft.description, rows: 3, placeholder: 'Servicios de la sucursal...' })}`;

  openDrawer({
    title: isNew ? 'Nueva sucursal' : 'Editar sucursal',
    submitLabel: isNew ? 'Crear sucursal' : 'Guardar cambios',
    body,
    onSubmit(form) {
      const data = new FormData(form);
      const name = data.get('name').trim();
      if (!name) return invalid(form, 'name', 'Escribe el nombre de la sucursal.');

      const list = ctx.data.branches;
      let id = draft.id;
      if (isNew) {
        id = slugify(name);
        for (let n = 2; list.some((b) => b.id === id); n += 1) id = `${slugify(name)}-${n}`;
      }
      const values = {
        id,
        name,
        short: data.get('short').trim() || name,
        fullName: data.get('fullName').trim(),
        tag: data.get('tag').trim(),
        description: data.get('description').trim(),
      };
      return ctx.run(() => branchesApi.save(values, isNew ? list.length : undefined), isNew ? 'Sucursal creada' : 'Sucursal actualizada');
    },
  });
}

export default {
  render(el, ctx) {
    const { branches, bikes } = ctx.data;

    el.innerHTML = `
      <div class="admin-toolbar">
        <div>
          <h1 class="heading-font text-4xl leading-none">Sucursales</h1>
          <p class="mt-1 text-sm text-gray-400">El orden y los nombres se usan en toda la web (barra superior, textos, fichas y tarjetas).</p>
        </div>
        <button type="button" class="btn py-3 text-lg" data-action="new">${icon('plus')} Nueva sucursal</button>
      </div>
      <div class="space-y-3">
        ${branches.length ? branches.map((b, i) => row(b, i, branches.length)).join('') : emptyState('No hay sucursales.')}
      </div>`;

    el.oninput = el.onchange = null;

    el.onclick = (e) => {
      const action = e.target.closest('button[data-action]')?.dataset.action;
      if (!action) return;
      if (action === 'new') return openForm(ctx);

      const index = branches.findIndex((b) => b.id === e.target.closest('[data-id]')?.dataset.id);
      const branch = branches[index];
      if (!branch) return;

      if (action === 'edit') return openForm(ctx, branch);
      if (action === 'up' || action === 'down') {
        const ids = branches.map((b) => b.id);
        const target = index + (action === 'up' ? -1 : 1);
        [ids[index], ids[target]] = [ids[target], ids[index]];
        return ctx.run(() => branchesApi.reorder(ids), 'Orden actualizado');
      }
      if (action === 'delete') {
        const used = bikes.filter((b) => b.branches.includes(branch.id)).length;
        const extra = used ? `\n${used} moto(s) la tienen marcada; se les quitará.` : '';
        if (confirmAction(`¿Eliminar la sucursal «${branch.name}»?${extra}`)) {
          ctx.run(() => branchesApi.remove(branch.id), 'Sucursal eliminada');
        }
      }
    };
  },
};
