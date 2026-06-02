import { test, expect } from '@playwright/test';

// smoke тест - реальный запрос к Groq через /api/chat
// не использует браузер - просто HTTP запрос
// запускается только мануально

test.describe('Smoke - реальный Groq', () => {

  test('/api/chat - Groq отвечает на реальный запрос', async ({ request }) => {
    // request - это встроенный в Playwright HTTP клиент
    const response = await request.post(`${process.env.BASE_URL}/api/chat`, {
      headers: { 'Content-Type': 'application/json' },
      data: {
        messages: [
          { role: 'system', content: 'You are an interviewer. Ask one short question.' },
          { role: 'user', content: 'Hello, I am ready for the interview.' }
        ]
      }
    });

    // API отвечает 200
    expect(response.status()).toBe(200);

    const body = await response.json();

    // ответ содержит текст от Groq
    expect(body.reply).toBeTruthy();
    expect(typeof body.reply).toBe('string');
    expect(body.reply.length).toBeGreaterThan(10);

    console.log('Groq ответил:', body.reply.slice(0, 100));
  });

});
