import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

// extend base test with our custom fixtures
// base test has { page } - we add { authenticatedPage }
export const test = base.extend<{
  authenticatedPage: LoginPage['page'] extends infer P ? P : never;
}>({
  // Playwright calls this automatically before each test that uses it
  authenticatedPage: async ({ page }, use) => {
    // log in using LoginPage
    const loginPage = new LoginPage(page);
    await loginPage.login(
      process.env.TEST_USER_EMAIL!,
      process.env.TEST_USER_PASSWORD!,
    );

    // hand the logged-in page to the test
    await use(page);

    // nothing to clean up - browser context resets after each test
  },
});

// re-export expect so tests only need one import
export { expect } from '@playwright/test';
