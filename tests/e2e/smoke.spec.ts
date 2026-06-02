import { test, expect } from '@playwright/test';
import { loginTestUser } from '../helpers/auth';

// этот файл запускается ТОЛЬКО мануально через GitHub Actions
// реальный запрос к Groq - тратит токены (~500 за прогон)

test.describe('Smoke - реальный Groq', () => {

  test('Select → Interview - AI реально отвечает', async ({ page }) => {
    await loginTestUser(page);
    await page.goto('/practice');

    // выбираем самый простой вариант
    await page.locator('div').filter({ hasText: /^Frontend/ }).first().click();
    await page.getByText('Junior').first().click();
    await page.getByText('Normal').first().click();
    await page.getByRole('button', { name: /start/i }).click();

    await expect(page).toHaveURL(/\/interview/, { timeout: 15_000 });

    // ждём пока AI пришлёт первый вопрос (реальный запрос - до 15 сек)
    await expect(page.locator('[class*="transcript"], [class*="message"], p').first())
      .not.toBeEmpty({ timeout: 20_000 });
  });

});
