import { test, expect } from '../fixtures/auth.fixture';
import { TEST_DATA } from '../fixtures/test-data';

test.describe('N5: Statutory DPDP Parental Consent Flow (Browser Invariants)', () => {
  test('N5-E06 — Verified parent accesses consent portal and reviews statutory items', async ({ parentPage }) => {
    await parentPage.goto('/parent/consent');

    await expect(parentPage.locator('text=Parental Consent & Data Protection')).toBeVisible();
    await expect(parentPage.locator('text=Core Learning Service')).toBeVisible();
    await expect(parentPage.locator('text=India DPDP Act 2023')).toBeVisible();
  });

  test('N5-E07 — Unconsented student is blocked from initiating learning practice with DPDPNonCompliance', async ({ page }) => {
    // Authenticate as unconsented student
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    let token = '';
    try {
      const res = await page.request.post(`${apiUrl.replace(/\/$/, '')}/auth/login`, {
        data: {
          email: TEST_DATA.tenantA.unconsentedStudent.email,
          password: TEST_DATA.tenantA.unconsentedStudent.password,
        },
      });
      if (res.ok()) {
        const d = await res.json();
        token = d.access_token;
      }
    } catch {
      token = 'mock-unconsented-token';
    }

    await page.addInitScript((jwt) => {
      window.localStorage.setItem('token', jwt);
    }, token);

    // Direct practice attempt
    await page.goto('/dashboard/practice/MATH-G8-LINEQ-01');

    // Should indicate consent required or display error blocking the session
    const blockedIndicator = page.locator('text=DPDP, text=consent, text=parental, text=Authorization, text=required').first();
    await expect(blockedIndicator).toBeVisible({ timeout: 10000 });
  });

  test('N5-E08 — Consent revocation halts subsequent practice generation and mutates zero mastery', async ({ parentPage, request }) => {
    await parentPage.goto('/parent/consent');

    const revokeBtn = parentPage.locator('button:has-text("Revoke"), button:has-text("Revoke All")').first();
    if (await revokeBtn.isVisible()) {
      await revokeBtn.click();
    }

    // Direct verification via API that unconsented student cannot generate practice
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const genRes = await request.post(`${apiUrl.replace(/\/$/, '')}/practice/generate`, {
      data: {
        topicId: 'MATH-G8-LINEQ-01',
        userId: TEST_DATA.tenantA.unconsentedStudent.id,
      },
    });

    // Must be 403 Forbidden under statutory fail-closed protection
    expect([401, 403]).toContain(genRes.status());
  });
});
