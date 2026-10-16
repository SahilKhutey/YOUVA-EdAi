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

/** Browser origins allowed to call the API. Comma-separated; defaults to local development only. */
export function corsOrigins(env: string | undefined): string[] {
  const list = (env ?? '').split(',').map((o) => o.trim().replace(/\/+$/, '')).filter(Boolean);
  if (list.includes('*')) throw new Error('CORS_ORIGINS must list exact origins; "*" is not allowed.');
  return list.length ? list : ['http://localhost:3000'];
}

/** API docs are served only outside production unless explicitly enabled. */
export function swaggerEnabled(nodeEnv: string | undefined, flag: string | undefined): boolean {
  return nodeEnv !== 'production' || (flag ?? '').toLowerCase() === 'true';
}
