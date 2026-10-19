/** Pure helpers for reading deployment settings from the environment. */

/** Number of reverse proxies in front of the app (0 = none). Needed so rate limiting sees each user's real IP. */
export function trustProxyHops(env: string | undefined): number {
  if (env === undefined || env.trim() === '') return 0;
  const n = Number(env);
  if (!Number.isInteger(n) || n < 0 || n > 3) {
    throw new Error('TRUST_PROXY_HOPS must be a whole number from 0 to 3.');
  }
  return n;
}

/**
 * Browser origins allowed to call the API. `CORS_ORIGINS` (comma-separated) wins; otherwise `FRONTEND_URL`
 * (already set by render.yaml) is used; otherwise local development only.
 */
export function corsOrigins(env: string | undefined, frontendUrl?: string): string[] {
  const clean = (v: string | undefined) => (v ?? '').split(',').map((o) => o.trim().replace(/\/+$/, '')).filter(Boolean);
  const list = clean(env);
  if (list.includes('*')) throw new Error('CORS_ORIGINS must list exact origins; "*" is not allowed.');
  if (list.length) return list;
  const fallback = clean(frontendUrl);
  if (fallback.includes('*')) throw new Error('FRONTEND_URL must be an exact origin; "*" is not allowed.');
  return fallback.length ? fallback : ['http://localhost:3000'];
}

/** The origins to use, read from the real environment. */
export function allowedOrigins(): string[] {
  return corsOrigins(process.env.CORS_ORIGINS, process.env.FRONTEND_URL);
}

/**
 * Optional URL prefix for every HTTP route (for example "api"). The frontend in render.yaml calls
 * https://backend/api/..., so set API_PREFIX=api there. Empty means routes are served at the root.
 */
export function apiPrefix(env: string | undefined): string {
  const v = (env ?? '').trim().replace(/^\/+|\/+$/g, '');
  if (v === '') return '';
  if (!/^[A-Za-z0-9-]+$/.test(v)) throw new Error('API_PREFIX may contain only letters, digits and hyphens.');
  return v;
}

/** API docs are served only outside production unless explicitly enabled. */
export function swaggerEnabled(nodeEnv: string | undefined, flag: string | undefined): boolean {
  return nodeEnv !== 'production' || (flag ?? '').toLowerCase() === 'true';
}
