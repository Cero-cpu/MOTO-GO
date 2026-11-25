#!/usr/bin/env node
/**
 * Crea (o promueve) un usuario administrador del panel.
 *
 *   npm run admin:create -- correo@ejemplo.com 'Contraseña-segura'
 *
 * Local: toma la URL y la clave de servicio de `supabase status` automáticamente.
 * Nube:  SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=... npm run admin:create -- ...
 *
 * ⚠️ La clave de servicio (service_role) da acceso total: NUNCA va en la web ni en .env de Vite.
 */
import { execSync } from 'node:child_process';

const [email, password] = process.argv.slice(2);
if (!email || !password) {
  console.error('Uso: npm run admin:create -- correo@ejemplo.com \'Contraseña\'');
  process.exit(1);
}
if (password.length < 10) {
  console.error('La contraseña debe tener al menos 10 caracteres.');
  process.exit(1);
}

function localCredentials() {
  const env = Object.fromEntries(
    execSync('supabase status -o env', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
      .split('\n')
      .map((line) => line.match(/^([A-Z_]+)="?(.*?)"?$/))
      .filter(Boolean)
      .map(([, k, v]) => [k, v]),
  );
  return { url: env.API_URL, key: env.SERVICE_ROLE_KEY };
}

const { url, key } = process.env.SUPABASE_URL
  ? { url: process.env.SUPABASE_URL, key: process.env.SUPABASE_SERVICE_ROLE_KEY }
  : localCredentials();

if (!url || !key) {
  console.error('Faltan SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (¿está iniciado Supabase local?).');
  process.exit(1);
}

const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };

async function request(path, options = {}) {
  const res = await fetch(`${url}${path}`, { ...options, headers: { ...headers, ...options.headers } });
  const body = res.status === 204 ? null : await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, body };
}

// 1) Crear el usuario (confirmado) o localizarlo si ya existe
let userId;
const created = await request('/auth/v1/admin/users', {
  method: 'POST',
  body: JSON.stringify({ email, password, email_confirm: true }),
});
if (created.ok) {
  userId = created.body.id;
  console.log(`✓ Usuario creado: ${email}`);
} else if (created.status === 422 || /already/i.test(JSON.stringify(created.body))) {
  const list = await request(`/auth/v1/admin/users?per_page=1000`);
  userId = list.body?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase())?.id;
  if (!userId) throw new Error('El usuario existe pero no se pudo localizar.');
  await request(`/auth/v1/admin/users/${userId}`, { method: 'PUT', body: JSON.stringify({ password }) });
  console.log(`✓ Usuario existente: ${email} (contraseña actualizada)`);
} else {
  console.error('No se pudo crear el usuario:', created.body);
  process.exit(1);
}

// 2) Darle permisos de administrador
const promoted = await request('/rest/v1/admins', {
  method: 'POST',
  headers: { Prefer: 'resolution=ignore-duplicates' },
  body: JSON.stringify({ user_id: userId }),
});
if (!promoted.ok && promoted.status !== 409) {
  console.error('No se pudo marcar como administrador:', promoted.body);
  process.exit(1);
}
console.log('✓ Permisos de administrador asignados. Ya puede entrar en /admin/');
