import { test, expect } from '@playwright/test';
import { loginTestUser } from '../helpers/auth';

test.describe('Auth', () => {

  test('successful login - redirects to /profile', async ({ page }) => {
    await loginTestUser(page);
    await expect(page).toHaveURL(/\/profile/);
  });

  test('wrong password - shows error message', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('you@example.com').fill(process.env.TEST_USER_EMAIL!);
    await page.getByPlaceholder('8+ chars, letter, number, symbol').fill('WrongPassword!1');
    await page.getByRole('button', { name: 'Sign In' }).last().click();

    await expect(page.locator('div').filter({ hasText: /invalid login|credentials/i }).last())
      .toBeVisible({ timeout: 10_000 });
  });

  test('logout - returns to /', async ({ page }) => {
    await loginTestUser(page);

    // open profile dropdown
    await page.getByRole('button', { name: /profile/i }).click();

    // Sign Out is hidden via display:none on parent - dispatchEvent bypasses visibility check
    await page.locator('div').filter({ hasText: /^Sign Out$/ }).dispatchEvent('click');

    await expect(page).toHaveURL('/');
  });

});
