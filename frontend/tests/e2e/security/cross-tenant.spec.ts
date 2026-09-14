import { test, expect } from '../fixtures/auth.fixture';

test.describe('N5: Multi-Tenant Isolation & Role Boundary Enforcement (Browser Invariants)', () => {
  test('N5-E40 — Tenant A student cannot access Tenant B learner profile (Cross-Tenant Isolation)', async ({ studentPage: page, request }) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const token = await page.evaluate(() => localStorage.getItem('token'));

    // Tenant A student attempts to read Tenant B student profile
    const res = await request.get(`${apiUrl.replace(/\/$/, '')}/users/s-modern-101`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-tenant-id': 'tenant-dps-rkp',
      },
    });

    expect([401, 403, 404]).toContain(res.status());
  });

  test('N5-E41 — Tenant A teacher cannot access Tenant B student roster', async ({ teacherPage: page, request }) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const token = await page.evaluate(() => localStorage.getItem('token'));

    const res = await request.get(`${apiUrl.replace(/\/$/, '')}/teacher/learners?tenantId=tenant-modern-vv`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-tenant-id': 'tenant-dps-rkp',
      },
    });

    // Should return only Tenant A learners or reject with 403
    if (res.ok()) {
      const body = await res.json();
      if (Array.isArray(body)) {
        for (const item of body) {
          expect(item.email || '').not.toContain('modernschool.edu.in');
        }
      }
    } else {
      expect([401, 403]).toContain(res.status());
    }
  });

  test('N5-E42 — Tenant A parent cannot view Tenant B child details', async ({ parentPage: page, request }) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const token = await page.evaluate(() => localStorage.getItem('token'));

    const res = await request.get(`${apiUrl.replace(/\/$/, '')}/parent/learners/s-modern-101`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-tenant-id': 'tenant-dps-rkp',
      },
    });

    expect([401, 403, 404]).toContain(res.status());
  });

  test('N5-E43 — Tenant A educator cannot resolve Tenant B pastoral safety incident', async ({ teacherPage: page, request }) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const token = await page.evaluate(() => localStorage.getItem('token'));

    const res = await request.post(`${apiUrl.replace(/\/$/, '')}/safety/resolve`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-tenant-id': 'tenant-dps-rkp',
      },
      data: {
        incidentId: 'inc-modern-safety-01',
        rationale: 'Unauthorized cross-tenant resolution',
        signature: 'sig-dps-educator-key',
      },
    });

    expect([401, 403, 404]).toContain(res.status());
  });

  test('N5-E44 — Cross-tenant audit access is strictly forbidden from browser session context', async ({ studentPage: page, request }) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const token = await page.evaluate(() => localStorage.getItem('token'));

    const res = await request.get(`${apiUrl.replace(/\/$/, '')}/audit/events?tenantId=tenant-modern-vv`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // Students have no audit privileges
    expect([401, 403, 404]).toContain(res.status());
  });

  test('N5-E45 — Student session attempting to invoke /teacher/* endpoints receives 403 Forbidden', async ({ studentPage: page, request }) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const token = await page.evaluate(() => localStorage.getItem('token'));

    const res = await request.get(`${apiUrl.replace(/\/$/, '')}/teacher/learners`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status()).toBe(403);
  });

  test('N5-E46 — Insecure Direct Object Reference (IDOR) with spoofed student ID is rejected', async ({ studentPage: page, request }) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const token = await page.evaluate(() => localStorage.getItem('token'));

    // Authenticated as s-dps-101, attempt to query s-dps-102 without authorization
    const res = await request.get(`${apiUrl.replace(/\/$/, '')}/api/learning/sessions?userId=s-dps-102`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // Should return 403 or empty array scoped only to the authenticated principal
    if (res.ok()) {
      const data = await res.json();
      if (Array.isArray(data)) {
        for (const session of data) {
          expect(session.userId).not.toBe('s-dps-102');
        }
      }
    } else {
      expect([401, 403, 404]).toContain(res.status());
    }
  });
});
