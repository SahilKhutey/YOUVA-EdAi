import { allowedOrigins, apiPrefix, corsOrigins, swaggerEnabled, trustProxyHops } from './http-config';

describe('deployment settings', () => {
  it('trust proxy defaults to 0 and accepts 0 to 3 hops only', () => {
    expect(trustProxyHops(undefined)).toBe(0);
    expect(trustProxyHops('')).toBe(0);
    expect(trustProxyHops('1')).toBe(1);
    for (const bad of ['-1', '4', '1.5', 'abc']) expect(() => trustProxyHops(bad)).toThrow(/TRUST_PROXY_HOPS/);
  });

  it('CORS origins default to local development, are trimmed, and never allow a wildcard', () => {
    expect(corsOrigins(undefined)).toEqual(['http://localhost:3000']);
    expect(corsOrigins(' https://a.example.org/ , https://b.example.org ')).toEqual(['https://a.example.org', 'https://b.example.org']);
    expect(() => corsOrigins('*')).toThrow(/not allowed/);
    expect(() => corsOrigins('https://a.example.org,*')).toThrow(/not allowed/);
  });

  it('API docs are off in production unless explicitly enabled', () => {
    expect(swaggerEnabled('production', undefined)).toBe(false);
    expect(swaggerEnabled('production', 'true')).toBe(true);
    expect(swaggerEnabled(undefined, undefined)).toBe(true);
    expect(swaggerEnabled('development', 'false')).toBe(true);
  });

  it('falls back to FRONTEND_URL when CORS_ORIGINS is not set, and CORS_ORIGINS wins when both are set', () => {
    expect(corsOrigins(undefined, 'https://app.example.org/')).toEqual(['https://app.example.org']);
    expect(corsOrigins('https://a.example.org', 'https://app.example.org')).toEqual(['https://a.example.org']);
    expect(corsOrigins('', '')).toEqual(['http://localhost:3000']);
    expect(() => corsOrigins(undefined, '*')).toThrow(/not allowed/);
  });

  it('allowedOrigins reads both settings from the real environment', () => {
    const old = { c: process.env.CORS_ORIGINS, f: process.env.FRONTEND_URL };
    delete process.env.CORS_ORIGINS; process.env.FRONTEND_URL = 'https://render-front.example.org';
    expect(allowedOrigins()).toEqual(['https://render-front.example.org']);
    if (old.c === undefined) delete process.env.CORS_ORIGINS; else process.env.CORS_ORIGINS = old.c;
    if (old.f === undefined) delete process.env.FRONTEND_URL; else process.env.FRONTEND_URL = old.f;
  });

  it('the API prefix is empty by default, trimmed, and letters/digits/hyphens only', () => {
    expect(apiPrefix(undefined)).toBe('');
    expect(apiPrefix(' /api/ ')).toBe('api');
    for (const bad of ['a/b', 'a b', 'api?x', '../x']) expect(() => apiPrefix(bad)).toThrow(/API_PREFIX/);
  });
});
