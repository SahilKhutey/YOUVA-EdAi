import { Page, expect } from '@playwright/test';

export class SafetyPage {
  constructor(private readonly page: Page) {}

  async gotoSafetyQueue() {
    await this.page.goto('/dashboard/teacher/safety');
  }

  async filterSeverity(severity: 'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW') {
    const filterBtn = this.page.locator(`button:has-text("${severity}")`);
    await filterBtn.click();
  }

  async openFirstIncident() {
    const resolveBtn = this.page.locator('button:has-text("Review & Resolve"), button:has-text("Resolve")');
    if (await resolveBtn.count() > 0) {
      await resolveBtn.first().click();
    }
  }

  async resolveIncident(rationale: string, signature: string) {
    await this.page.locator('textarea[placeholder*="Conducted 1-on-1"]').fill(rationale);
    await this.page.locator('input[placeholder*="sig-teacher-"]').fill(signature);
    await this.page.locator('button[type="submit"]:has-text("Sign & Resolve")').click();
  }

  async expectFormError(text: string) {
    const errorBanner = this.page.locator('text=' + text);
    await expect(errorBanner).toBeVisible();
  }
}
