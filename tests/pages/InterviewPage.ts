import { Page } from '@playwright/test';

export class InterviewPage {
  constructor(private page: Page) {}

  // --- selectors ---

  // timer - span with digits followed by "min", e.g. "20 min"
  get timer() {
    return this.page.locator('span').filter({ hasText: /^\d+ min$/ }).first();
  }

  // end interview button
  get endButton() {
    return this.page.getByRole('button', { name: /end|finish/i });
  }

  // --- actions ---

  // check the page is loaded and ready
  async isLoaded() {
    await this.timer.waitFor({ state: 'visible' });
    await this.endButton.waitFor({ state: 'visible' });
  }
}
