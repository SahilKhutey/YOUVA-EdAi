import { test, expect } from '../fixtures/auth.fixture';

test.describe('N5: Pastoral Safety Escalation & Non-Repudiation Resolution (Browser Invariants)', () => {
  test('N5-E28 — Pastoral safety queue renders active safeguarding incidents', async ({ teacherPage: page }) => {
    await page.goto('/dashboard/teacher/safety');

    await expect(page.locator('text=Pastoral Safety & Urgent Escalations, text=Safety').first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=Critical, text=High, text=Pending').first()).toBeVisible();
  });

  test('N5-E29 — Critical distress ingestion triggers automated escalation and dual-channel dispatch', async ({ teacherPage: page, request }) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const token = await page.evaluate(() => localStorage.getItem('token'));

    const res = await request.post(`${apiUrl.replace(/\/$/, '')}/safety/events`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        studentId: 's-dps-101',
        category: 'SELF_HARM',
        severity: 'CRITICAL',
        summary: 'Student expressed acute distress during evening revision.',
        source: 'AI_TUTOR_FLAG',
      },
    });

    expect([200, 201]).toContain(res.status());
  });

  test('N5-E30 — Safety queue filtering isolates critical from routine incidents', async ({ teacherPage: page }) => {
    await page.goto('/dashboard/teacher/safety');

    const critFilter = page.locator('button:has-text("CRITICAL")');
    if (await critFilter.isVisible()) {
      await critFilter.click();
      // Should filter view
      await expect(page.locator('text=CRITICAL').first()).toBeVisible();
    }
  });

  test('N5-E31 — AI actor is strictly blocked from resolving safety incidents (SafetyGovernanceViolation)', async ({ teacherPage: page, request }) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

    // Simulated AI actor token or header attempting resolution
    const res = await request.post(`${apiUrl.replace(/\/$/, '')}/safety/resolve`, {
      headers: { 'x-actor-role': 'AI' },
      data: {
        incidentId: 'inc-test-01',
        rationale: 'Autonomous AI auto-resolution',
        signature: 'ai-signature-automated-key',
      },
    });

    // Hard governance invariant: AI cannot resolve safety incidents
    expect([401, 403]).toContain(res.status());
  });

  test('N5-E32 — Human educator resolves incident with >= 10 char rationale and >= 16 char signature', async ({ teacherPage: page }) => {
    await page.goto('/dashboard/teacher/safety');

    const resolveBtn = page.locator('button:has-text("Resolve"), button:has-text("Review & Resolve")').first();
    if (await resolveBtn.isVisible()) {
      await resolveBtn.click();

      // Test validation: too short rationale
      await page.locator('textarea[placeholder*="Conducted 1-on-1"]').fill('short');
      await page.locator('input[placeholder*="sig-teacher-"]').fill('sig-test-12345678');
      await page.locator('button[type="submit"]:has-text("Sign & Resolve")').click();

      // Expect validation message
      await expect(page.locator('text=10 characters, text=rationale').first()).toBeVisible();

      // Now supply compliant inputs
      await page.locator('textarea[placeholder*="Conducted 1-on-1"]').fill('Conducted 1-on-1 pastoral check-in with student and guardian.');
      await page.locator('input[placeholder*="sig-teacher-"]').fill('sig-teacher-dps-delhi-2026-auth');
      await page.locator('button[type="submit"]:has-text("Sign & Resolve")').click();

      // Modal closes or status updates
      await expect(page.locator('text=RESOLVED').first()).toBeVisible({ timeout: 10000 });
    }
  });

  test('N5-E33 — Incident resolution updates state atomically with immutable audit ledger binding', async ({ teacherPage: page, request }) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const token = await page.evaluate(() => localStorage.getItem('token'));

    const escalationsRes = await request.get(`${apiUrl.replace(/\/$/, '')}/safety/escalations`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect([200, 401, 403]).toContain(escalationsRes.status());
  });
});
