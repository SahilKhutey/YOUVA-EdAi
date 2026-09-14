import { Page, expect } from '@playwright/test';

export class AuthPage {
  constructor(private readonly page: Page) {}

  async gotoLogin() {
    await this.page.goto('/auth/login');
  }

  async gotoRegister() {
    await this.page.goto('/auth/register');
  }

  async login(email: string, pass: string) {
    await this.gotoLogin();
    await this.page.locator('input#email').fill(email);
    await this.page.locator('input#password').fill(pass);
    await this.page.locator('button[type="submit"]').click();
  }

  async register(email: string, pass: string, role: 'STUDENT' | 'TEACHER' = 'STUDENT') {
    await this.gotoRegister();
    await this.page.locator('input#email').fill(email);
    await this.page.locator('input#password').fill(pass);
    if (role === 'TEACHER') {
      await this.page.getByRole('button', { name: 'Teacher' }).click();
    } else {
      await this.page.getByRole('button', { name: 'Student' }).click();
    }
    await this.page.locator('button[type="submit"]').click();
  }

  async logout() {
    await this.page.evaluate(() => {
      localStorage.removeItem('token');
    });
    await this.page.goto('/auth/login');
  }

  async expectSessionActive() {
    const token = await this.page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeTruthy();
  }

  async expectError(pattern: RegExp | string) {
    const errorBanner = this.page.locator('div.text-red-600, div.text-destructive');
    await expect(errorBanner).toBeVisible();
    if (typeof pattern === 'string') {
      await expect(errorBanner).toContainText(pattern);
    } else {
      await expect(errorBanner).toHaveText(pattern);
    }
  }
}
