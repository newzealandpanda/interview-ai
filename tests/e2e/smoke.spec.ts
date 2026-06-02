import { test, expect } from '@playwright/test';
import { loginTestUser } from '../helpers/auth';

test.describe('Smoke - реальный Groq', () => {

  test('Select -> Interview - AI реально отвечает', async ({ page }) => {
    await loginTestUser(page);
    await page.goto('/practice');

    await page.getByText('QA Engineer').click();
    await page.getByText('Junior').click();
    await page.getByText('Normal').first().click();
    await page.getByRole('button', { name: /Start Interview/i }).click();

    await expect(page).toHaveURL(/\/interview/, { timeout: 15_000 });

    // transcript рендерится через inline стили - ищем div с фоном AI (#1a3535)
    // ждём пока появится хотя бы один пузырь от AI
    await expect(page.locator('div[style*="1a3535"]').first())
      .toBeVisible({ timeout: 25_000 });
  });

});
