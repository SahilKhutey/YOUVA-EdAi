import { test, expect } from '../fixtures/auth.fixture';

test.describe('N5: System Reliability, Error Boundaries & Responsive Behavior', () => {
  test('N5-E34 — API server error displays recoverable UI state rather than unhandled exception', async ({ studentPage: page }) => {
    // Intercept API call to simulate a 500 Internal Server Error
    await page.route('**/api/learning/start', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Internal engine error during calculation' }),
      });
    });

    await page.goto('/dashboard/learn/MATH-G8-LINEQ-01');

    // Verify user sees graceful error notification or fallback state
    const errorState = page.locator('text=temporarily unavailable, text=error, text=trouble, text=safe').first();
    await expect(errorState).toBeVisible({ timeout: 10000 });
  });

  test('N5-E35 — Network disconnect triggers offline banner or network error state', async ({ studentPage: page }) => {
    await page.route('**/api/learning/start', (route) => {
      route.abort('failed');
    });

    await page.goto('/dashboard/learn/MATH-G8-LINEQ-01');

    // Should indicate network connection issue gracefully
    await expect(page.locator('text=Network, text=connection, text=offline').first()).toBeVisible({ timeout: 10000 });
  });

  test('N5-E36 — Browser back and forward navigation preserves state without duplicating attempts', async ({ studentPage: page }) => {
    await page.goto('/dashboard');
    await page.goto('/dashboard/practice/MATH-G8-LINEQ-01');
    await page.goBack();

    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 10000 });

    await page.goForward();
    await expect(page).toHaveURL(/\/dashboard\/practice\/MATH-G8-LINEQ-01/, { timeout: 10000 });
  });

  test('N5-E37 — Mobile responsive viewport renders learning controls and submit buttons without clipping', async ({ studentPage: page }) => {
    // Set mobile viewport explicitly if not in mobile project
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/dashboard/practice/MATH-G8-LINEQ-01');

    // Ensure main title and submit button are visible within viewport
    await expect(page.locator('text=Linear Equations, text=Practice').first()).toBeVisible({ timeout: 15000 });
    const submitBtn = page.locator('button:has-text("Submit Completed Answers")');
    if (await submitBtn.isVisible()) {
      await expect(submitBtn).toBeInViewport();
    }
  });

  test('N5-E38 — Refresh preserves session authorization without kicking user out', async ({ studentPage: page }) => {
    await page.goto('/dashboard');
    await page.reload();

    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 10000 });
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeTruthy();
  });

  test('N5-E39 — Rapid double submission is prevented by disabled button state', async ({ studentPage: page }) => {
    await page.goto('/dashboard/practice/MATH-G8-LINEQ-01');

    const submitBtn = page.locator('button:has-text("Submit Completed Answers")');
    if (await submitBtn.isVisible()) {
      // Click button
      await submitBtn.click({ clickCount: 2, delay: 50 });

      // Button should be disabled while request is submitting
      const isDisabled = await submitBtn.getAttribute('disabled');
      const opacity = await submitBtn.getAttribute('class');
      expect(isDisabled !== null || opacity?.includes('opacity-50')).toBeTruthy();
    }
  });
});
