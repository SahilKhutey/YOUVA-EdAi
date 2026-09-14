import { test, expect } from '@playwright/test';
import { AuthPage } from '../pages/auth.page';
import { TEST_DATA } from '../fixtures/test-data';

test.describe('N5: Authentication & Session Security (Browser Invariants)', () => {
  let authPage: AuthPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
  });

  test('N5-E01 — Student Registration establishes authenticated session and redirects to dashboard', async ({ page }) => {
    const timestamp = Date.now();
    const newStudentEmail = `e2e.student.${timestamp}@dpsrkp.edu.in`;
    const password = 'Password@123';

    await authPage.register(newStudentEmail, password, 'STUDENT');

    // Assert session is established in localStorage and redirects away from register
    await expect(page).not.toHaveURL(/\/auth\/register/, { timeout: 10000 });
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeTruthy();
  });

  test('N5-E02 — Valid credentials authenticate and navigate to dashboard', async ({ page }) => {
    await authPage.login(TEST_DATA.tenantA.student.email, TEST_DATA.tenantA.student.password);

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeTruthy();
  });

  test('N5-E03 — Invalid credentials display controlled error without establishing session', async ({ page }) => {
    await authPage.login('nonexistent.user@dpsrkp.edu.in', 'WrongPassword123');

    await authPage.expectError(/invalid|failed/i);
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeFalsy();
    expect(page.url()).toContain('/auth/login');
  });

  test('N5-E04 — Logout invalidates local session and redirects to login', async ({ page }) => {
    // Start by setting active token
    await page.goto('/auth/login');
    await page.evaluate(() => localStorage.setItem('token', 'active-test-session-jwt'));

    await authPage.logout();

    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeNull();
    expect(page.url()).toContain('/auth/login');
  });

  test('N5-E05 — Protected route redirects unauthenticated user to login', async ({ page }) => {
    // Ensure no token
    await page.goto('/auth/login');
    await page.evaluate(() => localStorage.clear());

    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10000 });
  });
});
