import { Page, expect } from '@playwright/test';

export class StudentPage {
  constructor(private readonly page: Page) {}

  async gotoDashboard() {
    await this.page.goto('/dashboard');
  }

  async gotoPractice(topicId: string = 'MATH-G8-LINEQ-01') {
    await this.page.goto(`/dashboard/practice/${topicId}`);
  }

  async gotoLearn(topicId: string = 'MATH-G8-LINEQ-01') {
    await this.page.goto(`/dashboard/learn/${topicId}`);
  }

  async selectOption(questionIndex: number, optionIndex: number = 0) {
    const questionCard = this.page.locator('.clay-card').nth(questionIndex);
    const optionButton = questionCard.locator('button').nth(optionIndex);
    await optionButton.click();
  }

  async revealHint(questionIndex: number) {
    const questionCard = this.page.locator('.clay-card').nth(questionIndex);
    const hintButton = questionCard.locator('button:has-text("Hint")');
    if (await hintButton.isVisible()) {
      await hintButton.click();
    }
  }

  async submitPractice() {
    const submitBtn = this.page.locator('button:has-text("Submit Completed Answers")');
    await submitBtn.click();
  }

  async expectMasteryBanner() {
    const banner = this.page.locator('text=Mastery Gain');
    await expect(banner).toBeVisible();
  }

  async expectCompetencyBadge() {
    const badge = this.page.locator('text=CBSE Grade 8 Competency Exceeded, text=NCERT Core Algebraic Standard Met');
    await expect(badge.first()).toBeVisible();
  }

  async sendTutorMessage(message: string) {
    const input = this.page.locator('input[placeholder*="Ask your question"], input[placeholder*="Type a message"]');
    await input.fill(message);
    const sendBtn = this.page.locator('button:has-text("Send"), button[type="submit"]');
    await sendBtn.click();
  }

  async expectTutorResponse() {
    const aiMessage = this.page.locator('.bg-muted, .text-foreground').filter({ hasText: /tutor|hint|step|equation/i });
    await expect(aiMessage.first()).toBeVisible();
  }
}
