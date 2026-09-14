import { test, expect } from '../fixtures/auth.fixture';

test.describe('N5: Parent Control Plane & Privacy Isolation (Browser Invariants)', () => {
  test('N5-E24 — Parent portal displays verified linked children', async ({ parentPage: page }) => {
    await page.goto('/parent');

    await expect(page.locator('text=YOUVA SafeGuard Parent Portal')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=Your Children')).toBeVisible();
  });

  test('N5-E25 — Parent inspects child progress breakdown and recent mastery trajectory', async ({ parentPage: page }) => {
    await page.goto('/parent/children/s-dps-101');

    await expect(page.locator('text=Mastery, text=Linear Equations, text=Progress').first()).toBeVisible({ timeout: 15000 });
  });

  test('N5-E26 — Parent attempting to query unlinked student receives 403 Forbidden', async ({ parentPage: page, request }) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const token = await page.evaluate(() => localStorage.getItem('token'));

    // Attempt to access unlinked student from another cohort or tenant
    const res = await request.get(`${apiUrl.replace(/\/$/, '')}/parent/learners/s-modern-101/progress`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect([403, 404]).toContain(res.status());
  });

  test('N5-E27 — Privilege escalation check: Parent cannot authorize interventions or alter mastery', async ({ parentPage: page, request }) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const token = await page.evaluate(() => localStorage.getItem('token'));

    const res = await request.post(`${apiUrl.replace(/\/$/, '')}/teacher/interventions/test-int-01/authorize`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { rationale: 'Unauthorized parent override attempt' },
    });

    // Must be 403 Forbidden for PARENT role
    expect(res.status()).toBe(403);
  });
});
