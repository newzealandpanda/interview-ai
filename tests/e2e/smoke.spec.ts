import { test, expect } from '@playwright/test';

// smoke тест - реальный запрос к Groq через /api/chat
// запускается только мануально через GitHub Actions

test.describe('Smoke - реальный Groq', () => {

  test('/api/chat - Groq отвечает на реальный запрос', async ({ request }) => {
    // базовый URL Supabase - без /rest/v1/
    const supabaseBase = 'https://jhevmjvkvdruswuarozs.supabase.co';

    // шаг 1 - логинимся в Supabase и получаем JWT токен
    const loginRes = await request.post(
      `${supabaseBase}/auth/v1/token?grant_type=password`,
      {
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.VITE_SUPABASE_ANON_KEY!,
        },
        data: {
          email: process.env.TEST_USER_EMAIL,
          password: process.env.TEST_USER_PASSWORD,
        }
      }
    );

    expect(loginRes.status()).toBe(200);
    const { access_token } = await loginRes.json();
    expect(access_token).toBeTruthy();

    // шаг 2 - реальный запрос к Groq с токеном
    const chatRes = await request.post(`${process.env.BASE_URL}/api/chat`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${access_token}`,
      },
      data: {
        messages: [{ role: 'user', content: 'Hello, I am ready.' }],
        role: 'QA Engineer',
        level: 'Junior',
        mode: 'normal',
        asked: 0,
        timeRemaining: 1200,
        duration: 20,
      }
    });

    expect(chatRes.status()).toBe(200);
    const body = await chatRes.json();

    expect(body.text).toBeTruthy();
    expect(body.text.length).toBeGreaterThan(5);

    console.log('Groq ответил:', body.text.slice(0, 100));
  });

});
