import { IMAGE_SIZES } from '../config.js';

/**
 * Prepara una foto en el navegador ANTES de subirla: la reduce y la convierte a WebP
 * en dos tamaños (640 px para las cards y 1600 px para la vista en grande).
 * Una foto de móvil de 4 MB queda en ~40 KB + ~200 KB.
 * @returns {Promise<{ sm: Blob, lg: Blob }>}
 */
export async function makeImageVariants(file, quality = 0.8) {
  if (!file.type.startsWith('image/')) throw new Error('no es una imagen');
  const bitmap = await createImageBitmap(file);
  try {
    const [sm, lg] = await Promise.all([
      resize(bitmap, IMAGE_SIZES.sm, quality),
      resize(bitmap, IMAGE_SIZES.lg, quality),
    ]);
    return { sm, lg };
  } finally {
    bitmap.close?.();
  }
}

function resize(bitmap, maxSize, quality) {
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('no se pudo procesar la imagen'))), 'image/webp', quality);
  });
}
