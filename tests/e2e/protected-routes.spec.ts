import { test, expect } from '@playwright/test';

test.describe('Protected routes', () => {

  test('/profile без логина - показывает замок', async ({ page }) => {
    await page.goto('/profile');
    await expect(page.getByText('Sign in to see your profile')).toBeVisible();
  });

  test('/practice доступна без логина', async ({ page }) => {
    await page.goto('/practice');

    // уточняем - берём именно заголовок h2, не div
    await expect(page.getByRole('heading', { name: 'Choose Your Role' })).toBeVisible();
  });

  test('/practice - кнопка Start без логина редиректит на /login', async ({ page }) => {
    await page.goto('/practice');

    // выбираем роль
    await page.locator('div').filter({ hasText: /^Frontend/ }).first().click();

    // выбираем уровень
    await page.getByText('Junior').first().click();

    // выбираем режим
    await page.getByText('Normal').first().click();

    // жмём Start - должен уйти на /login
    await page.getByRole('button', { name: /start/i }).click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('/ - главная открывается без логина', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/');
    await expect(page.locator('body')).not.toBeEmpty();
  });

});
