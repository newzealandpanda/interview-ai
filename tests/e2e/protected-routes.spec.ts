import { test, expect } from '@playwright/test';

test.describe('Protected routes', () => {

  test('/profile without login - shows lock screen', async ({ page }) => {
    await page.goto('/profile');
    await expect(page.getByText('Sign in to see your profile')).toBeVisible();
  });

  test('/practice is accessible without login', async ({ page }) => {
    await page.goto('/practice');

    // target h2 heading specifically, not the div below it
    await expect(page.getByRole('heading', { name: 'Choose Your Role' })).toBeVisible();
  });

  test('/practice - Start button without login redirects to /login', async ({ page }) => {
    await page.goto('/practice');

    // select role
    await page.locator('div').filter({ hasText: /^Frontend/ }).first().click();

    // select level
    await page.getByText('Junior').first().click();

    // select mode
    await page.getByText('Normal').first().click();

    // click Start - should redirect to /login
    await page.getByRole('button', { name: /start/i }).click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('/ - home page loads without login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/');
    await expect(page.locator('body')).not.toBeEmpty();
  });

});
