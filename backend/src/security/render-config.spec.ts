import * as fs from 'fs';
import * as path from 'path';

/** Guards the deployment blueprint against the mistakes found in review. It reads render.yaml as text. */
const raw = fs.readFileSync(path.join(__dirname, '../../../render.yaml'), 'utf8');
// Comments explain the settings and may mention the flags they forbid; only real configuration lines are checked.
const yaml = raw.split('\n').filter((l) => !l.trim().startsWith('#')).join('\n');
const value = (key: string) => yaml.match(new RegExp(`- key: ${key}\\s*\\n\\s*value:\\s*"?([^"\\n]+)"?`))?.[1].trim();

describe('render.yaml', () => {
  it('never deploys a schema change that could delete data', () => {
    expect(yaml).not.toMatch(/--accept-data-loss/);
  });

  it('serves the API under the same prefix the frontend calls', () => {
    const apiUrl = value('NEXT_PUBLIC_API_URL')!;
    const frontendPath = new URL(apiUrl).pathname.replace(/^\/|\/$/g, '');
    expect(value('API_PREFIX')).toBe(frontendPath);
  });

  it('lets only the frontend origin call the API', () => {
    expect(value('CORS_ORIGINS')).toBe(value('FRONTEND_URL'));
  });

  it('keeps pilot-safe settings: no public sign-up, bank questions only, AI and shared board off, one proxy hop', () => {
    expect(value('ALLOW_PUBLIC_REGISTRATION')).toBe('false');
    expect(value('QUESTION_SOURCE')).toBe('BANK');
    expect(value('ENABLE_AI_FEATURES')).toBe('false');
    expect(value('ENABLE_SHARED_BOARD')).toBe('false');
    expect(value('ENABLE_FORUM')).toBe('false');
    expect(value('NEXT_PUBLIC_ENABLE_FORUM')).toBe('false');
    expect(value('NEXT_PUBLIC_ENABLE_AI_MENTOR')).toBe('false');
    expect(value('TRUST_PROXY_HOPS')).toBe('1');
    expect(value('NODE_ENV')).toBe('production');
  });

  it('generates the JWT secret instead of hardcoding one', () => {
    expect(yaml).toMatch(/- key: JWT_SECRET\s*\n\s*generateValue: true/);
  });
});
