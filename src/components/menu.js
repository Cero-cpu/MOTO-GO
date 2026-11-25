import { $, $$ } from '../lib/utils.js';

const DESKTOP_QUERY = '(min-width: 1024px)';

export function initMobileMenu() {
  const toggle = $('#menu-toggle');
  const menu = $('#mobile-menu');
  if (!toggle || !menu) return;
  const iconUse = $('use', toggle);

  const setOpen = (open) => {
    menu.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    iconUse.setAttribute('href', open ? '#i-xmark' : '#i-bars');
  };

  toggle.addEventListener('click', () => setOpen(menu.hidden));
  $$('a', menu).forEach((link) => link.addEventListener('click', () => setOpen(false)));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !menu.hidden) setOpen(false);
  });
  // Al pasar a escritorio, el menú móvil no debe quedar abierto
  window.matchMedia(DESKTOP_QUERY).addEventListener('change', (e) => {
    if (e.matches) setOpen(false);
  });
}

/** Sombra bajo el menú fijo en cuanto la página deja de estar arriba del todo. */
export function initStickyHeader() {
  const header = $('.site-header');
  if (!header) return;
  const update = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
  window.addEventListener('scroll', update, { passive: true });
  update();
}

/** Marca en el menú principal la sección que se está viendo. */
export function initScrollSpy() {
  const links = $$('.nav-link[href^="#"]');
  if (!links.length || !('IntersectionObserver' in window)) return;
  const byId = new Map(links.map((a) => [a.hash.slice(1), a]));

  const visible = new Set();
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) visible[entry.isIntersecting ? 'add' : 'delete'](entry.target.id);
    // #servicios va dentro de #inicio: gana la sección más interna (la última en el orden de la lista)
    const active = [...byId.keys()].filter((id) => visible.has(id)).at(-1);
    links.forEach((a) => (a.hash === `#${active}` ? a.setAttribute('aria-current', 'location') : a.removeAttribute('aria-current')));
  }, { rootMargin: '-45% 0px -50% 0px' }); // franja central de la pantalla

  byId.forEach((_, id) => {
    const section = document.getElementById(id);
    if (section) observer.observe(section);
  });
}
