/**
 * Lectura de datos para la web pública.
 *
 * - UNA sola petición (función get_site_data de la base de datos), sin cargar la librería
 *   completa de Supabase: la web pública pesa mucho menos.
 * - Caché "stale-while-revalidate": se pinta al instante con lo guardado de la visita anterior
 *   y se actualiza en cuanto llegan los datos frescos.
 */
import { DEFAULT_SETTINGS, SUPABASE_ANON_KEY, SUPABASE_URL } from '../config.js';
import { INITIAL_SITE_DATA } from '../lib/initial-data.js';

export const CACHE_KEY = 'motogo:site-data:v1';
const CHANNEL = 'motogo-data';

export const BIKE_STATUS = { disponible: 'Disponible', reservada: 'Reservada', vendida: 'Vendida' };

/** Asegura la forma de los datos (la web nunca se rompe por un campo vacío). */
export function normalizeSiteData(raw = {}) {
  const settings = raw.settings ?? {};
  return {
    categories: raw.categories ?? [],
    branches: raw.branches ?? [],
    offers: raw.offers ?? [],
    bikes: (raw.bikes ?? []).map((b) => ({
      ...b,
      price: b.price ? Number(b.price) : null,
      images: b.images ?? [],
      branches: b.branches ?? [],
    })),
    settings: {
      contact: { ...DEFAULT_SETTINGS.contact, ...settings.contact },
      finance: { ...DEFAULT_SETTINGS.finance, ...settings.finance, monthlyRate: Number(settings.finance?.monthlyRate ?? DEFAULT_SETTINGS.finance.monthlyRate) },
    },
  };
}

export async function fetchSiteData() {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_site_data`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: '{}',
    });
    if (!response.ok) throw new Error(`No se pudieron cargar los datos (HTTP ${response.status})`);
    return normalizeSiteData(await response.json());
  } catch (error) {
    const cached = readCache();
    if (cached) return cached;
    const initial = normalizeSiteData(INITIAL_SITE_DATA);
    writeCache(initial);
    return initial;
  }
}

export function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? normalizeSiteData(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function writeCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    /* modo privado o almacenamiento lleno: la web funciona igual sin caché */
  }
}

/** Avisa a las pestañas abiertas de la web de que el panel guardó cambios. */
export function notifyDataChange() {
  if ('BroadcastChannel' in globalThis) new BroadcastChannel(CHANNEL).postMessage('updated');
}

export function onDataChange(callback) {
  if ('BroadcastChannel' in globalThis) new BroadcastChannel(CHANNEL).addEventListener('message', callback);
}
