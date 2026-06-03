import { test, expect } from '@playwright/test';
import { loginTestUser } from '../helpers/auth';

test.describe('Resume page', () => {

  test('/resume - page loads with upload zone', async ({ page }) => {
    await loginTestUser(page);
    await page.goto('/resume');

    await expect(page.getByText('Drop your resume here or click to upload')).toBeVisible();
  });

  test('/resume - analyze button is disabled before file upload', async ({ page }) => {
    // mock /api/resume - return data.feedback as the app expects
    await page.route('**/api/resume', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          feedback: `OVERALL_SCORE: 78
ATS_SCORE: 72
SUMMARY: Good resume with clear structure.
STRENGTHS: Strong technical skills listed.
IMPROVEMENTS: Add more quantifiable achievements.
VERDICT: Ready for most positions.`
        }),
      });
    });

    await loginTestUser(page);
    await page.goto('/resume');

    // analyze button is disabled until a file is selected
    const analyzeBtn = page.getByRole('button', { name: '🔍 Analyze Resume' });
    await expect(analyzeBtn).toBeDisabled();

    // inject file via JS - bypasses pdfjsLib, we only check UI reacts to file selection
    await page.evaluate(() => {
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const blob = new Blob(['resume text content for testing'], { type: 'application/pdf' });
      const file = new File([blob], 'test-resume.pdf', { type: 'application/pdf' });
      const dt = new DataTransfer();
      dt.items.add(file);
      input.files = dt.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });

    // filename appears in the UI
    await expect(page.getByText('test-resume.pdf')).toBeVisible({ timeout: 5_000 });
  });

});
