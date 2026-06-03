import { test, expect } from '@playwright/test';

// smoke test - real Groq request via /api/chat
// run manually only via GitHub Actions

test.describe('Smoke - real Groq', () => {

  test('/api/chat - Groq responds to a real request', async ({ request }) => {
    // Supabase base URL - without /rest/v1/
    const supabaseBase = 'https://jhevmjvkvdruswuarozs.supabase.co';

    // step 1 - login to Supabase and get JWT token
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

    // step 2 - real request to Groq with auth token
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

    console.log('Groq replied:', body.text.slice(0, 100));
  });

});
