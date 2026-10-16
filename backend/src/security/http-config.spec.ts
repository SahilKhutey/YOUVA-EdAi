import { corsOrigins, swaggerEnabled, trustProxyHops } from './http-config';

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
});
