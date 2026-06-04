import { Page } from '@playwright/test';

export class SelectPage {
  constructor(private page: Page) {}

  // --- selectors ---

  // role card by text
  role(name: string) {
    return this.page.getByText(name);
  }

  // level button by text
  level(name: string) {
    return this.page.getByText(name).first();
  }

  // mode button by text
  mode(name: string) {
    return this.page.getByText(name).first();
  }

  // Start Interview button
  get startButton() {
    return this.page.getByRole('button', { name: /Start Interview/i });
  }

  // --- actions ---

  // open select page
  async goto() {
    await this.page.goto('/practice');
  }

  // select role, level, mode and click start
  // returns after navigation to /interview
  async startInterview(role: string, level: string, mode: string) {
    await this.goto();
    await this.role(role).click();
    await this.level(level).click();
    await this.mode(mode).click();
    await this.startButton.click();
    await this.page.waitForURL('**/interview', { timeout: 15_000 });
  }
}
