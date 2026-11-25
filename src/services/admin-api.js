/**
 * Acceso a datos del PANEL (requiere sesión de administrador).
 * Usa el cliente oficial de Supabase: autenticación, base de datos y almacenamiento de imágenes.
 *
 * Incluye soporte directo para credenciales locales (admin / admin) y respaldo local
 * para que el panel funcione con o sin backend activo.
 */
import { createClient } from '@supabase/supabase-js';
import { IMAGE_SIZES, SUPABASE_ANON_KEY, SUPABASE_URL } from '../config.js';
import { isStoredImage } from '../lib/utils.js';
import { makeImageVariants } from '../lib/image.js';
import { normalizeSiteData, notifyDataChange, readCache, writeCache } from './site-api.js';
import { INITIAL_SITE_DATA } from '../lib/initial-data.js';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true },
});

const BUCKET = 'media';
const VARIANTS = [IMAGE_SIZES.sm, IMAGE_SIZES.lg];
const uuid = () => crypto.randomUUID();

function getLocalData() {
  return readCache() || normalizeSiteData(INITIAL_SITE_DATA);
}

function updateLocalCache(updater) {
  const data = getLocalData();
  const res = updater(data);
  writeCache(data);
  notifyDataChange();
  return res !== undefined ? res : data;
}

/** Traduce errores de Postgres/Supabase a mensajes comprensibles. */
function toError(error) {
  const messages = {
    42501: 'No tienes permiso para hacer esto. Vuelve a iniciar sesión.',
    23503: 'No se puede: hay otros datos que dependen de este elemento.',
    23505: 'Ya existe un elemento con ese identificador.',
    23514: 'Algún dato no es válido (revisa precios, fechas o números).',
    PGRST301: 'La sesión expiró. Vuelve a iniciar sesión.',
  };
  return new Error(messages[error.code] ?? error.message ?? 'Error desconocido');
}

/** Lanza si la respuesta trae error; si no, avisa a la web de que hay cambios. */
function check({ data, error }) {
  if (error) throw toError(error);
  return data;
}

async function mutate(promise) {
  const data = check(await promise);
  notifyDataChange();
  return data;
}

/* ---------- Sesión ---------- */
export const auth = {
  async session() {
    const local = localStorage.getItem('motogo:admin-session');
    if (local) {
      try {
        return JSON.parse(local);
      } catch {}
    }
    const { data } = await supabase.auth.getSession().catch(() => ({ data: {} }));
    return data?.session || null;
  },

  async signIn(email, password) {
    const userOrEmail = (email || '').trim().toLowerCase();
    // Soporte directo para credenciales admin / admin
    if ((userOrEmail === 'admin' || userOrEmail === 'admin@motogo.com' || userOrEmail === 'admin@admin.com') && password === 'admin') {
      const mockSession = {
        user: { id: 'admin-local', email: 'admin' },
        access_token: 'local-admin-token',
      };
      localStorage.setItem('motogo:admin-session', JSON.stringify(mockSession));
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message === 'Invalid login credentials' ? 'Correo o contraseña incorrectos.' : error.message);
  },

  async signOut() {
    localStorage.removeItem('motogo:admin-session');
    try {
      await supabase.auth.signOut();
    } catch {}
  },

  async isAdmin() {
    if (localStorage.getItem('motogo:admin-session')) return true;
    try {
      return check(await supabase.rpc('is_admin')) === true;
    } catch {
      return false;
    }
  },

  onChange: (callback) => supabase.auth.onAuthStateChange(callback),
};

/** Todos los datos (como administrador: incluye motos ocultas y ofertas no vigentes). */
export async function loadAll() {
  if (!localStorage.getItem('motogo:admin-session')) {
    try {
      const res = await supabase.rpc('get_site_data');
      if (res?.data) return normalizeSiteData(res.data);
    } catch {}
  }
  return getLocalData();
}

/* ---------- Imágenes ---------- */
export const media = {
  /** Comprime y sube una foto; devuelve la clave que se guarda en la base de datos. */
  async upload(file, folder) {
    if (localStorage.getItem('motogo:admin-session')) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }
    try {
      const variants = await makeImageVariants(file);
      const key = `${folder}/${uuid()}`;
      const files = { [IMAGE_SIZES.sm]: variants.sm, [IMAGE_SIZES.lg]: variants.lg };
      await Promise.all(VARIANTS.map(async (size) => {
        const { error } = await supabase.storage.from(BUCKET).upload(`${key}-${size}.webp`, files[size], {
          contentType: 'image/webp',
          cacheControl: '31536000',
          upsert: false,
        });
        if (error) throw new Error(`No se pudo subir la imagen: ${error.message}`);
      }));
      return key;
    } catch {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }
  },

  /** Borra del almacenamiento las fotos indicadas (las URLs externas se ignoran). */
  async remove(keys) {
    const paths = keys.filter(isStoredImage).flatMap((k) => VARIANTS.map((s) => `${k}-${s}.webp`));
    if (!paths.length) return;
    try {
      const { error } = await supabase.storage.from(BUCKET).remove(paths);
      if (error) console.warn('No se pudieron borrar algunas imágenes:', error.message);
    } catch {}
  },

  /** Copia una foto a otra carpeta (al duplicar una moto, cada una tiene sus archivos). */
  async copy(key, folder) {
    if (!isStoredImage(key)) return key;
    try {
      const next = `${folder}/${uuid()}`;
      await Promise.all(VARIANTS.map(async (s) => {
        const { error } = await supabase.storage.from(BUCKET).copy(`${key}-${s}.webp`, `${next}-${s}.webp`);
        if (error) throw new Error(`No se pudo copiar la imagen: ${error.message}`);
      }));
      return next;
    } catch {
      return key;
    }
  },
};

/* ---------- Motos ---------- */
const bikePayload = (b) => ({
  id: b.id, name: b.name, category: b.category, badge: b.badge, description: b.description,
  price: b.price, status: b.status, published: b.published, images: b.images, branches: b.branches,
});

export const bikesApi = {
  async save(bike) {
    if (localStorage.getItem('motogo:admin-session')) {
      const id = bike.id || uuid();
      updateLocalCache((data) => {
        const idx = data.bikes.findIndex((b) => b.id === id);
        const entry = {
          ...bike,
          id,
          createdAt: bike.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        if (idx >= 0) data.bikes[idx] = entry;
        else data.bikes.unshift(entry);
      });
      return { id };
    }
    try {
      return await mutate(supabase.rpc('save_bike', { p: bikePayload(bike) }));
    } catch {
      const id = bike.id || uuid();
      updateLocalCache((data) => {
        const idx = data.bikes.findIndex((b) => b.id === id);
        const entry = {
          ...bike,
          id,
          createdAt: bike.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        if (idx >= 0) data.bikes[idx] = entry;
        else data.bikes.unshift(entry);
      });
      return { id };
    }
  },

  async setPublished(id, published) {
    if (localStorage.getItem('motogo:admin-session')) {
      return updateLocalCache((data) => {
        const b = data.bikes.find((x) => x.id === id);
        if (b) b.published = published;
      });
    }
    try {
      return await mutate(supabase.from('bikes').update({ published }).eq('id', id));
    } catch {
      return updateLocalCache((data) => {
        const b = data.bikes.find((x) => x.id === id);
        if (b) b.published = published;
      });
    }
  },

  async remove(bike) {
    if (localStorage.getItem('motogo:admin-session')) {
      return updateLocalCache((data) => {
        data.bikes = data.bikes.filter((b) => b.id !== bike.id);
      });
    }
    try {
      await mutate(supabase.from('bikes').delete().eq('id', bike.id));
      await media.remove(bike.images);
    } catch {
      updateLocalCache((data) => {
        data.bikes = data.bikes.filter((b) => b.id !== bike.id);
      });
    }
  },

  async duplicate(bike) {
    const id = uuid();
    const images = [...(bike.images || [])];
    return bikesApi.save({ ...bike, id, name: `${bike.name} (copia)`, published: false, images });
  },
};

/* ---------- Ofertas ---------- */
const offerRow = (o) => ({
  id: o.id, title: o.title, tag: o.tag, description: o.description, image_path: o.image,
  button_text: o.buttonText, wa_message: o.waMessage,
  starts_at: o.startsAt || null, ends_at: o.endsAt || null, active: o.active,
});

export const offersApi = {
  async save(offer) {
    if (localStorage.getItem('motogo:admin-session')) {
      const id = offer.id || uuid();
      return updateLocalCache((data) => {
        const idx = data.offers.findIndex((o) => o.id === id);
        const entry = { ...offer, id };
        if (idx >= 0) data.offers[idx] = entry;
        else data.offers.unshift(entry);
      });
    }
    try {
      return await mutate(supabase.from('offers').upsert(offerRow(offer)));
    } catch {
      const id = offer.id || uuid();
      return updateLocalCache((data) => {
        const idx = data.offers.findIndex((o) => o.id === id);
        const entry = { ...offer, id };
        if (idx >= 0) data.offers[idx] = entry;
        else data.offers.unshift(entry);
      });
    }
  },

  async setActive(id, active) {
    if (localStorage.getItem('motogo:admin-session')) {
      return updateLocalCache((data) => {
        const o = data.offers.find((x) => x.id === id);
        if (o) o.active = active;
      });
    }
    try {
      return await mutate(supabase.from('offers').update({ active }).eq('id', id));
    } catch {
      return updateLocalCache((data) => {
        const o = data.offers.find((x) => x.id === id);
        if (o) o.active = active;
      });
    }
  },

  async remove(offer) {
    if (localStorage.getItem('motogo:admin-session')) {
      return updateLocalCache((data) => {
        data.offers = data.offers.filter((o) => o.id !== offer.id);
      });
    }
    try {
      await mutate(supabase.from('offers').delete().eq('id', offer.id));
      await media.remove([offer.image]);
    } catch {
      updateLocalCache((data) => {
        data.offers = data.offers.filter((o) => o.id !== offer.id);
      });
    }
  },
};

/* ---------- Sucursales ---------- */
const branchRow = (b) => ({
  id: b.id, name: b.name, short_name: b.short, full_name: b.fullName ?? '', tag: b.tag, description: b.description,
});

export const branchesApi = {
  async save(branch, sortOrder) {
    if (localStorage.getItem('motogo:admin-session')) {
      const id = branch.id || uuid();
      return updateLocalCache((data) => {
        const idx = data.branches.findIndex((b) => b.id === id);
        const entry = { ...branch, id };
        if (idx >= 0) data.branches[idx] = entry;
        else data.branches.push(entry);
      });
    }
    try {
      return await mutate(supabase.from('branches').upsert({ ...branchRow(branch), ...(sortOrder !== undefined && { sort_order: sortOrder }) }));
    } catch {
      const id = branch.id || uuid();
      return updateLocalCache((data) => {
        const idx = data.branches.findIndex((b) => b.id === id);
        const entry = { ...branch, id };
        if (idx >= 0) data.branches[idx] = entry;
        else data.branches.push(entry);
      });
    }
  },

  async remove(id) {
    if (localStorage.getItem('motogo:admin-session')) {
      return updateLocalCache((data) => {
        data.branches = data.branches.filter((b) => b.id !== id);
      });
    }
    try {
      return await mutate(supabase.from('branches').delete().eq('id', id));
    } catch {
      return updateLocalCache((data) => {
        data.branches = data.branches.filter((b) => b.id !== id);
      });
    }
  },

  async reorder(ids) {
    if (localStorage.getItem('motogo:admin-session')) {
      return updateLocalCache((data) => {
        const map = new Map(data.branches.map((b) => [b.id, b]));
        data.branches = ids.map((id) => map.get(id)).filter(Boolean);
      });
    }
    try {
      return await mutate(supabase.rpc('reorder_branches', { ids }));
    } catch {
      return updateLocalCache((data) => {
        const map = new Map(data.branches.map((b) => [b.id, b]));
        data.branches = ids.map((id) => map.get(id)).filter(Boolean);
      });
    }
  },
};

/* ---------- Ajustes y categorías ---------- */
export const settingsApi = {
  async save({ contact, finance }) {
    if (localStorage.getItem('motogo:admin-session')) {
      return updateLocalCache((data) => {
        data.settings = {
          contact: { ...data.settings.contact, ...contact },
          finance: { ...data.settings.finance, ...finance },
        };
      });
    }
    try {
      return await mutate(supabase.from('settings').update({
        whatsapp: contact.whatsapp,
        phone_display: contact.phoneDisplay,
        monthly_rate: finance.monthlyRate,
        terms: finance.terms,
        default_term: finance.defaultTerm,
        price_min: finance.price.min,
        price_max: finance.price.max,
        price_default: finance.price.default,
        down_min: finance.downPayment.min,
        down_max: finance.downPayment.max,
        down_default: finance.downPayment.default,
      }).eq('id', 1));
    } catch {
      return updateLocalCache((data) => {
        data.settings = {
          contact: { ...data.settings.contact, ...contact },
          finance: { ...data.settings.finance, ...finance },
        };
      });
    }
  },

  async saveCategories(items) {
    if (localStorage.getItem('motogo:admin-session')) {
      return updateLocalCache((data) => {
        data.categories = items;
      });
    }
    try {
      return await mutate(supabase.rpc('save_categories', { items }));
    } catch {
      return updateLocalCache((data) => {
        data.categories = items;
      });
    }
  },
};
