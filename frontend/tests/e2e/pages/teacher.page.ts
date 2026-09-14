import { Page, expect } from '@playwright/test';

export class TeacherPage {
  constructor(private readonly page: Page) {}

  async gotoWorkspace() {
    await this.page.goto('/dashboard/teacher');
  }

  async switchTab(tab: 'overview' | 'interventions' | 'recommendations' | 'students') {
    const tabBtn = this.page.locator(`button:has-text("${tab}")`);
    await tabBtn.first().click();
  }

  async expectMetricsVisible() {
    await expect(this.page.locator('text=Total Students')).toBeVisible();
    await expect(this.page.locator('text=Pending Interventions')).toBeVisible();
  }

  async authorizeFirstIntervention() {
    const authBtn = this.page.locator('button:has-text("Authorize")');
    if (await authBtn.count() > 0) {
      await authBtn.first().click();
    }
  }

  async rejectFirstIntervention() {
    const rejectBtn = this.page.locator('button:has-text("Dismiss"), button:has-text("Reject")');
    if (await rejectBtn.count() > 0) {
      await rejectBtn.first().click();
    }
  }
}
