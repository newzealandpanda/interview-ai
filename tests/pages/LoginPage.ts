import { Page } from '@playwright/test';

export class LoginPage {
  // page - browser tab, passed from outside
  constructor(private page: Page) {}

  // --- selectors - what we find on the page ---

  // email field
  get emailInput() {
    return this.page.getByPlaceholder('you@example.com');
  }

  // password field
  get passwordInput() {
    return this.page.getByPlaceholder('8+ chars, letter, number, symbol');
  }

  // Submit button in the form - .last() because nav has another one
  get signInButton() {
    return this.page.getByRole('button', { name: 'Sign In' }).last();
  }

  // --- actions - what we do on the page ---

  // open login page
  async goto() {
    await this.page.goto('/login');
  }

  // fill the form and log in
  async login(email: string, password: string) {
    await this.goto();
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.signInButton.click();
    await this.page.waitForURL('**/profile');
  }
}
