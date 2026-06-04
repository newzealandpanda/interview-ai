import { Page } from '@playwright/test';

export class InterviewPage {
  constructor(private page: Page) {}

  // --- selectors ---

  // end interview button
  get endButton() {
    return this.page.getByRole('button', { name: /end|finish/i });
  }

  // --- actions ---

  // check the page is loaded and ready
  async isLoaded() {
    await this.endButton.waitFor({ state: 'visible', timeout: 15_000 });
  }
}
