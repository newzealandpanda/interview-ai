import { test, expect } from '../fixtures';
import { SelectPage } from '../pages/SelectPage';
import { InterviewPage } from '../pages/InterviewPage';

test.describe('Interview flow (Groq mocked)', () => {

  test.beforeEach(async ({ page }) => {
    // intercept /api/chat and return a fake response - no real Groq call
    await page.route('**/api/chat', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ reply: 'Tell me about your experience with testing.' }),
      });
    });
  });

  test('Select - can choose role, level, mode and start interview', async ({ authenticatedPage: page }) => {
    const selectPage = new SelectPage(page);
    await selectPage.startInterview('QA Engineer', 'Junior', 'Normal');

    await expect(page).toHaveURL(/\/interview/);
  });

  test('Interview - page loads with timer and end button', async ({ authenticatedPage: page }) => {
    const selectPage = new SelectPage(page);
    const interviewPage = new InterviewPage(page);

    await selectPage.startInterview('QA Engineer', 'Junior', 'Normal');
    await interviewPage.isLoaded();
  });

});
