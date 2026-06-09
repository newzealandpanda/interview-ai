import { test, expect } from '../fixtures';

test.describe('Resume page', () => {

  test('/resume - page loads with upload zone', async ({ authenticatedPage: page }) => {
    await page.goto('/resume');
    await expect(page.getByText('Drop your resume here or click to upload')).toBeVisible();
  });

  test('/resume - analyze button is disabled before file upload', async ({ authenticatedPage: page }) => {
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

    await page.goto('/resume');

    // button is disabled until file is selected - SVG icon inside, match by partial text
    const analyzeBtn = page.getByRole('button', { name: /Analyze Resume/i });
    await expect(analyzeBtn).toBeDisabled();

    // inject file via JS - bypasses pdfjsLib
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
