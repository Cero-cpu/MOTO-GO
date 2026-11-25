import { defineConfig, loadEnv } from 'vite';
import { fileURLToPath } from 'node:url';
import { fontPreload, iconSprite, inlineCss } from './scripts/vite-plugins.js';

const root = fileURLToPath(new URL('.', import.meta.url));
const r = (path) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig(({ mode }) => {
  // Modo "tunnel" (npm run share): la web habla con Supabase a través de /_sb en el
  // mismo servidor, así funciona desde cualquier dispositivo vía el enlace de Cloudflare.
  const supabaseTarget = process.env.SUPABASE_PROXY_TARGET || loadEnv('development', root, 'VITE_').VITE_SUPABASE_URL;
  const shared = {
    allowedHosts: ['.trycloudflare.com'],
    proxy: mode === 'tunnel' && supabaseTarget
      ? { '/_sb': { target: supabaseTarget, changeOrigin: true, ws: true, rewrite: (p) => p.replace(/^\/_sb/, '') } }
      : undefined,
  };

  return {
    plugins: [
      iconSprite({
        root,
        pages: {
          // HTML → código JS que pinta iconos en esa página
          'index.html': ['src/main.js', 'src/components', 'src/lib'],
          'admin/index.html': ['src/admin.js', 'src/admin', 'src/lib'],
        },
      }),
      fontPreload(['barlow-condensed-latin-900-normal']),
      inlineCss(['index.html']),
    ],
    build: {
      target: 'es2022',
      cssMinify: 'lightningcss',
      rollupOptions: {
        input: {
          main: r('index.html'),
          admin: r('admin/index.html'),
        },
      },
    },
    server: { port: 5173, ...shared },
    preview: { port: 8080, ...shared },
  };
});
