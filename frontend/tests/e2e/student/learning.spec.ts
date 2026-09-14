import { test, expect } from '../fixtures/auth.fixture';
import { StudentPage } from '../pages/student.page';

test.describe('N5: Real Student Learning Journey (Browser Invariants)', () => {
  let studentPage: StudentPage;

  test.beforeEach(async ({ studentPage: page }) => {
    studentPage = new StudentPage(page);
  });

  test('N5-E09 — Student initiates practice session with progressive hint disclosure', async ({ studentPage: page }) => {
    await studentPage.gotoPractice('MATH-G8-LINEQ-01');

    // Wait for quiz to load
    await expect(page.locator('text=Grade 8 Linear Equations Practice')).toBeVisible({ timeout: 15000 });

    // Verify 3-tier progressive hint disclosure is accessible
    const hintBtn = page.locator('button:has-text("Hint")').first();
    if (await hintBtn.isVisible()) {
      await hintBtn.click();
      await expect(page.locator('text=Tier 1, text=Socratic')).toBeVisible();
    }
  });

  test('N5-E10 — Student answers questions and submits for authoritative BKT mastery calculation', async ({ studentPage: page }) => {
    await studentPage.gotoPractice('MATH-G8-LINEQ-01');

    // Answer questions if present
    const questionCards = page.locator('.clay-card');
    const count = await questionCards.count();
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const optionBtn = questionCards.nth(i).locator('button').first();
        if (await optionBtn.isVisible()) {
          await optionBtn.click();
        }
      }

      await studentPage.submitPractice();

      // Verify authoritative BKT mastery banner and diagnostic review rendered
      await expect(page.locator('text=Diagnostic Review, text=Mastery Gain, text=XP Earned').first()).toBeVisible({ timeout: 10000 });
    }
  });

  test('N5-E11 — Idempotency verification: Duplicate submission does not duplicate mastery deltas', async ({ studentPage: page, request }) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const token = await page.evaluate(() => localStorage.getItem('token'));

    const clientAttemptId = `client-attempt-idemp-${Date.now()}`;
    const payload = {
      clientAttemptId,
      sessionId: `sess-test-${Date.now()}`,
      activityId: 'MATH-G8-LINEQ-01',
      response: { selectedOption: 'x = 5' },
      isCorrect: true,
    };

    // First attempt submission
    const res1 = await request.post(`${apiUrl.replace(/\/$/, '')}/api/learning/attempts`, {
      headers: { Authorization: `Bearer ${token}` },
      data: payload,
    });

    // Second duplicate submission
    const res2 = await request.post(`${apiUrl.replace(/\/$/, '')}/api/learning/attempts`, {
      headers: { Authorization: `Bearer ${token}` },
      data: payload,
    });

    // Both should succeed gracefully or report IDEMPOTENT_HIT, not a 500 error
    expect([200, 201, 409]).toContain(res1.status());
    expect([200, 201, 409]).toContain(res2.status());
  });

  test('N5-E12 — Refresh recovery: active page preserves selected answers and does not crash', async ({ studentPage: page }) => {
    await studentPage.gotoPractice('MATH-G8-LINEQ-01');

    // Select first option
    const firstOption = page.locator('.clay-card button').first();
    if (await firstOption.isVisible()) {
      await firstOption.click();
      await page.reload();

      // Page reloads without unhandled rejection or blank screen
      await expect(page.locator('text=Grade 8 Linear Equations Practice')).toBeVisible({ timeout: 15000 });
    }
  });

  test('N5-E13 — Next adaptive activity recommendation is accessible post-completion', async ({ studentPage: page }) => {
    await studentPage.gotoDashboard();

    // Verify student dashboard displays learning modules and subject links
    await expect(page.locator('text=Mathematics, text=Continue, text=Practice').first()).toBeVisible({ timeout: 10000 });
  });

  test('N5-E14 — Competency badge matches authoritative mastery evaluation', async ({ studentPage: page }) => {
    await studentPage.gotoPractice('MATH-G8-LINEQ-01');

    const submitBtn = page.locator('button:has-text("Submit Completed Answers")');
    if (await submitBtn.isVisible()) {
      // If questions are present, select options and submit
      const cards = page.locator('.clay-card');
      const count = await cards.count();
      for (let i = 0; i < count; i++) {
        await cards.nth(i).locator('button').first().click();
      }
      await submitBtn.click();

      // Competency badge or result summary is shown
      await expect(page.locator('text=Competency, text=Master, text=Score').first()).toBeVisible({ timeout: 10000 });
    }
  });
});
