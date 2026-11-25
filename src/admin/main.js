/**
 * Panel de administración: acceso (login) y navegación entre secciones.
 */
import { auth, loadAll } from '../services/admin-api.js';
import { $, $$, initImageFallback, offerStatus, todayISO } from '../lib/utils.js';
import { toast } from './ui.js';
import bikesView from './views/bikes.js';
import offersView from './views/offers.js';
import branchesView from './views/branches.js';
import settingsView from './views/settings.js';

const VIEWS = { bikes: bikesView, offers: offersView, branches: branchesView, settings: settingsView };

const view = $('#view');
const loginScreen = $('#login');
const app = $('#app');
let current = location.hash.slice(1) in VIEWS ? location.hash.slice(1) : 'bikes';

/** Contexto compartido con las vistas. */
const ctx = {
  data: null,
  /**
   * Ejecuta una operación contra la base de datos, avisa del resultado
   * y recarga los datos para que el panel muestre siempre lo guardado de verdad.
   */
  async run(operation, message = 'Cambios guardados') {
    try {
      await operation();
      toast(`✓ ${message}`);
      return true;
    } catch (error) {
      console.error(error);
      toast(error.message, 'error');
      return false;
    } finally {
      await refresh();
    }
  },
};

async function refresh() {
  try {
    ctx.data = await loadAll();
    render();
  } catch (error) {
    toast(`No se pudieron cargar los datos: ${error.message}`, 'error');
  }
}

function updateCounts() {
  const { bikes, offers, branches } = ctx.data;
  $('[data-count="bikes"]').textContent = bikes.length;
  $('[data-count="offers"]').textContent = offers.filter((o) => offerStatus(o) === 'live').length || '';
  $('[data-count="branches"]').textContent = branches.length;
}

function render() {
  if (!ctx.data) return;
  $$('[data-tab]').forEach((tab) => tab.setAttribute('aria-selected', String(tab.dataset.tab === current)));
  VIEWS[current].render(view, ctx);
  updateCounts();
}

/* ---------- Acceso ---------- */
function showLogin(message = '') {
  app.hidden = true;
  loginScreen.hidden = false;
  $('[data-login-error]').textContent = message;
  $('[data-login-error]').hidden = !message;
  $('#login-email').focus();
}

async function showApp(session) {
  loginScreen.hidden = true;
  app.hidden = false;
  $('[data-user-email]').textContent = session.user.email;
  await refresh();
}

async function boot() {
  const session = await auth.session();
  if (!session) return showLogin();
  let isAdmin = false;
  try {
    isAdmin = await auth.isAdmin();
  } catch { /* sin conexión o sesión inválida */ }
  if (!isAdmin) {
    await auth.signOut();
    return showLogin('Este usuario no tiene permisos de administrador.');
  }
  return showApp(session);
}

$('#login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const button = e.target.querySelector('[type="submit"]');
  button.disabled = true;
  try {
    await auth.signIn($('#login-email').value.trim(), $('#login-password').value);
    await boot();
  } catch (error) {
    showLogin(error.message);
  } finally {
    button.disabled = false;
  }
});

$('[data-action="logout"]').addEventListener('click', async () => {
  await auth.signOut();
  ctx.data = null;
  showLogin();
});

auth.onChange((event) => {
  if (event === 'SIGNED_OUT' && !app.hidden) showLogin('La sesión se cerró. Vuelve a entrar.');
});

/* ---------- Pestañas ---------- */
$('.admin-tabs').addEventListener('click', (e) => {
  const tab = e.target.closest('[data-tab]');
  if (!tab || tab.dataset.tab === current) return;
  current = tab.dataset.tab;
  history.replaceState(null, '', `#${current}`);
  render();
  view.focus({ preventScroll: true });
});

/* ---------- Atajo: "/" enfoca el buscador de la sección ---------- */
document.addEventListener('keydown', (e) => {
  if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.target.closest('input, textarea, select, [contenteditable]')) return;
  if ($('#drawer').classList.contains('is-open') || app.hidden) return;
  const search = $('[data-search]', view);
  if (!search) return;
  e.preventDefault();
  search.focus();
  search.select();
});

/* ---------- Exportar datos (copia en JSON; las fotos quedan en el almacenamiento) ---------- */
$('[data-tool="export"]').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(ctx.data, null, 2)], { type: 'application/json' });
  const link = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(blob),
    download: `motogo-datos-${todayISO()}.json`,
  });
  link.click();
  URL.revokeObjectURL(link.href);
  toast('Datos exportados');
});

initImageFallback();
boot();
