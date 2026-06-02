import { test, expect } from '@playwright/test';
import { loginTestUser } from '../helpers/auth';

test.describe('Auth', () => {

  test('успешный логин - попадаем на /profile', async ({ page }) => {
    await loginTestUser(page);
    await expect(page).toHaveURL(/\/profile/);
  });

  test('неверный пароль - показывает ошибку', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('you@example.com').fill(process.env.TEST_USER_EMAIL!);
    await page.getByPlaceholder('8+ chars, letter, number, symbol').fill('WrongPassword!1');
    await page.getByRole('button', { name: 'Sign In' }).last().click();

    await expect(page.locator('div').filter({ hasText: /invalid login|credentials/i }).last())
      .toBeVisible({ timeout: 10_000 });
  });

  test('логаут - возвращает на /', async ({ page }) => {
    await loginTestUser(page);

    // открываем дропдаун
    await page.getByRole('button', { name: /profile/i }).click();

    // дропдаун скрыт через display:none на родителе - JS клик обходит это
    await page.locator('div').filter({ hasText: /^Sign Out$/ }).dispatchEvent('click');

    await expect(page).toHaveURL('/');
  });

});
