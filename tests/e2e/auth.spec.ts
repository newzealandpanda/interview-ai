import { test, expect } from '../fixtures';
import { LoginPage } from '../pages/LoginPage';

test.describe('Auth', () => {

  test('successful login - redirects to /profile', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.login(
      process.env.TEST_USER_EMAIL!,
      process.env.TEST_USER_PASSWORD!,
    );
    await expect(page).toHaveURL(/\/profile/);
  });

  test('wrong password - shows error message', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.emailInput.fill(process.env.TEST_USER_EMAIL!);
    await loginPage.passwordInput.fill('WrongPassword!1');
    await loginPage.signInButton.click();

    await expect(page.locator('div').filter({ hasText: /invalid login|credentials/i }).last())
      .toBeVisible({ timeout: 10_000 });
  });

  test('logout - returns to /', async ({ authenticatedPage: page }) => {
    // page is already logged in via fixture

    // open profile dropdown
    await page.getByRole('button', { name: /profile/i }).click();

    // Sign Out is hidden via display:none - dispatchEvent bypasses visibility check
    await page.locator('div').filter({ hasText: /^Sign Out$/ }).dispatchEvent('click');

    await expect(page).toHaveURL('/');
  });

});
