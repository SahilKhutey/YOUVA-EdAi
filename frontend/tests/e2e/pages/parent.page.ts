import { Page, expect } from '@playwright/test';

export class ParentPage {
  constructor(private readonly page: Page) {}

  async gotoPortal() {
    await this.page.goto('/parent');
  }

  async gotoConsent() {
    await this.page.goto('/parent/consent');
  }

  async gotoChildDetail(studentId: string) {
    await this.page.goto(`/parent/children/${studentId}`);
  }

  async expectLinkedChildrenVisible() {
    await expect(this.page.locator('text=Your Children')).toBeVisible();
  }

  async revokeConsent(consentType: string = 'LEARNING_SERVICE') {
    await this.gotoConsent();
    const revokeBtn = this.page.locator(`button:has-text("Revoke"), button:has-text("Revoke All")`);
    if (await revokeBtn.count() > 0) {
      await revokeBtn.first().click();
    }
  }
}
