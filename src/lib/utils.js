import { CURRENCY, DEFAULT_SETTINGS, IMAGE_SIZES, LOCALE, MEDIA_URL } from '../config.js';

/* ---------- DOM ---------- */
export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Escapa texto antes de insertarlo como HTML (los datos vienen del panel). */
export const escapeHtml = (value = '') => String(value ?? '').replace(/[&<>"']/g, (c) => ESCAPES[c]);

/** Icono del sprite SVG (el build incluye solo los iconos que se usan). */
export const icon = (name, className = '') =>
  `<svg class="icon ${className}" aria-hidden="true"><use href="#i-${name}"></use></svg>`;

/** Minúsculas y sin acentos, para búsquedas ("super" encuentra "Súper"). */
export const normalize = (value = '') =>
  String(value).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/** Identificador legible a partir de un texto: "San Francisco" → "san-francisco". */
export const slugify = (text) =>
  normalize(text).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `item-${Date.now().toString(36)}`;

/* ---------- Contacto / WhatsApp ---------- */
let contact = { ...DEFAULT_SETTINGS.contact };

export const configureContact = (values) => { contact = { ...contact, ...values }; };
export const getContact = () => contact;

export const whatsappUrl = (message) =>
  `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(message)}`;

/* ---------- Formato ---------- */
export const formatMoney = (amount) => `${CURRENCY} ${Math.round(amount).toLocaleString(LOCALE)}`;

/** Fecha local de hoy como "AAAA-MM-DD" (mismo formato que los <input type="date">). */
export function todayISO(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export const formatDate = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString(LOCALE, { day: 'numeric', month: 'long', year: 'numeric' });

const joinAnd = (items) => (items.length > 1 ? `${items.slice(0, -1).join(', ')} y ${items.at(-1)}` : items.join(''));

/** Textos con la lista de sucursales: "La Vega • Bonao • SFM", "La Vega, Bonao y SFM"... */
export function branchText(branches) {
  const short = branches.map((b) => b.short || b.name);
  const long = branches.map((b) => (b.fullName ? `${b.fullName} (${b.short})` : b.name));
  return { short: short.join(' • '), long: long.join(' • '), sentence: joinAnd(short), sentenceLong: joinAnd(long) };
}

/** Estado de una oferta según su interruptor y sus fechas. */
export function offerStatus(offer, today = todayISO()) {
  if (!offer.active) return 'off';
  if (offer.startsAt && today < offer.startsAt) return 'scheduled';
  if (offer.endsAt && today > offer.endsAt) return 'expired';
  return 'live';
}

/* ---------- Imágenes ----------
   Una imagen se guarda en la base de datos como:
   - una CLAVE del bucket "media" (p. ej. "bikes/<id>/<uuid>") → existen <clave>-640.webp y <clave>-1600.webp
   - o una URL absoluta (fotos externas, como las de ejemplo de Unsplash)                                */

export const FALLBACK_IMAGE = '/img/logo-448.webp';

export const isStoredImage = (src) => Boolean(src) && !/^(https?:|data:|blob:|\/)/.test(src);
const isUnsplash = (src) => src.includes('images.unsplash.com');

function unsplash(src, width) {
  const url = new URL(src);
  url.searchParams.set('w', String(width));
  url.searchParams.set('q', '70');
  return url.toString();
}

const stored = (key, size) => `${MEDIA_URL}/${key}-${size}.webp`;

/** URL de la imagen para el ancho pedido. */
export function imageSrc(src, width) {
  if (!src) return FALLBACK_IMAGE;
  if (isStoredImage(src)) return stored(src, width <= IMAGE_SIZES.sm ? IMAGE_SIZES.sm : IMAGE_SIZES.lg);
  return isUnsplash(src) ? unsplash(src, width) : src;
}

/** srcset para que cada pantalla descargue solo el tamaño que necesita. */
export function imageSrcset(src) {
  if (!src) return '';
  if (isStoredImage(src)) return `${stored(src, IMAGE_SIZES.sm)} ${IMAGE_SIZES.sm}w, ${stored(src, IMAGE_SIZES.lg)} ${IMAGE_SIZES.lg}w`;
  return isUnsplash(src) ? [480, 800, 1200, 1600].map((w) => `${unsplash(src, w)} ${w}w`).join(', ') : '';
}

/** <img> responsive con respaldo automático (ver initImageFallback). */
export function imageTag({ src, width, alt, sizes = '', className = '', lazy = true, attrs = '' }) {
  const srcset = imageSrcset(src);
  return `<img src="${escapeHtml(imageSrc(src, width))}"${srcset && sizes ? ` srcset="${escapeHtml(srcset)}" sizes="${sizes}"` : ''} alt="${escapeHtml(alt)}" class="${className}${src ? '' : ' img-fallback'}" data-fallback${lazy ? ' loading="lazy"' : ''} decoding="async" ${attrs}>`;
}

/** Si una foto no carga (404, sin conexión...), se sustituye por el logo. */
export function initImageFallback() {
  // Fundido al cargar: la foto aparece suave en vez de "pintarse" a trozos
  document.addEventListener('load', (e) => {
    if (e.target instanceof HTMLImageElement && e.target.hasAttribute('data-fallback')) e.target.classList.add('is-loaded');
  }, true);
  document.addEventListener('error', (e) => {
    const img = e.target;
    if (!(img instanceof HTMLImageElement) || !img.hasAttribute('data-fallback') || img.dataset.failed) return;
    img.dataset.failed = 'true';
    img.removeAttribute('srcset');
    img.classList.add('img-fallback');
    img.src = FALLBACK_IMAGE;
  }, true);
}

/* ---------- Finanzas ---------- */

/** Cuota fija mensual (sistema francés). */
export function monthlyPayment(principal, monthlyRate, months) {
  if (principal <= 0 || months <= 0) return 0;
  if (monthlyRate === 0) return principal / months;
  const factor = (1 + monthlyRate) ** months;
  return (principal * monthlyRate * factor) / (factor - 1);
}
