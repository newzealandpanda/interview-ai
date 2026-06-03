import { Page } from '@playwright/test';

export async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/login');

  await page.getByPlaceholder('you@example.com').fill(email);
  await page.getByPlaceholder('8+ chars, letter, number, symbol').fill(password);

  // use .last() - there are two "Sign In" buttons, the form button is the last one
  await page.getByRole('button', { name: 'Sign In' }).last().click();

  await page.waitForURL('**/profile');
}

export async function loginTestUser(page: Page) {
  await loginAs(
    page,
    process.env.TEST_USER_EMAIL!,
    process.env.TEST_USER_PASSWORD!,
  );
}
