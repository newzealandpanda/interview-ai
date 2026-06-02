import { test, expect } from '@playwright/test';
import { loginTestUser } from '../helpers/auth';
import { ROLES, LEVELS, MODES } from '../../src/constants.js';

test.describe('Interview flow (Groq замокан)', () => {

  test.beforeEach(async ({ page }) => {
    await page.route('**/api/chat', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ reply: 'Tell me about your experience with testing.' }),
      });
    });

    await loginTestUser(page);
  });

  test('Select - можно выбрать роль, уровень, режим и запустить интервью', async ({ page }) => {
    await page.goto('/practice');

    // шаг 1 - роль: кликаем на карточку с текстом "QA Engineer"
    await page.getByText('QA Engineer').click();

    // шаг 2 - уровень
    await page.getByText('Junior').click();

    // шаг 3 - режим: Normal
    await page.getByText('Normal').first().click();

    // шаг 4 - кнопка называется "Start Interview" с эмодзи
    await page.getByRole('button', { name: /Start Interview/i }).click();

    await expect(page).toHaveURL(/\/interview/, { timeout: 15_000 });
  });

  test('Interview - страница загружается с таймером и кнопкой завершения', async ({ page }) => {
    await page.goto('/practice');

    await page.getByText('QA Engineer').click();
    await page.getByText('Junior').click();
    await page.getByText('Normal').first().click();
    await page.getByRole('button', { name: /Start Interview/i }).click();

    await expect(page).toHaveURL(/\/interview/, { timeout: 15_000 });

    // таймер показывает минуты
    await expect(page.getByText(/min|минут/i)).toBeVisible();

    // кнопка завершения
    await expect(page.getByRole('button', { name: /end|finish|завершить/i })).toBeVisible();
  });

});
