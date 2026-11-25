/**
 * Configuración del sitio.
 * Los datos reales (motos, ofertas, sucursales, WhatsApp, tasa...) viven en la base de datos
 * y se editan desde el panel. Aquí solo hay conexión y valores de respaldo.
 */

// Admite una ruta relativa (p. ej. "/supabase" al compartir la web por un túnel con proxy)
export const SUPABASE_URL = new URL(import.meta.env.VITE_SUPABASE_URL, location.origin).href.replace(/\/$/, '');
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** URL pública del bucket de imágenes */
export const MEDIA_URL = `${SUPABASE_URL}/storage/v1/object/public/media`;

/** Tamaños en que se guarda cada foto subida desde el panel (ancho en px) */
export const IMAGE_SIZES = { sm: 640, lg: 1600 };

export const CURRENCY = 'RD$';
export const LOCALE = 'es-DO';

/** Valores de respaldo mientras cargan los datos (o si la base de datos no responde) */
export const DEFAULT_SETTINGS = {
  contact: {
    whatsapp: '18093870532', // número oficial (WhatsApp y llamadas)
    phoneDisplay: '+1 (809) 387-0532',
  },
  finance: {
    monthlyRate: 0.018,
    terms: [6, 12, 18, 24],
    defaultTerm: 12,
    price: { min: 30000, max: 450000, step: 5000, default: 85000 },
    downPayment: { min: 10, max: 60, step: 5, default: 25 },
  },
};
