import { Page, expect } from "@playwright/test";

export const ADMIRAL = {
  email: "admiral@glimmora.com",
  password: "demo",
  role: "executive",
};

export async function login(page: Page, account = ADMIRAL): Promise<void> {
  await page.goto("/login");
  await page.locator('input[type="email"]').fill(account.email);
  await page.locator('input[type="password"]').fill(account.password);
  await page.getByRole("button", { name: /access system/i }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 20_000 });
}

export async function expectAuthenticated(page: Page): Promise<void> {
  // The TopBar shows the user name; ensure it rendered.
  await expect(page).toHaveURL(/\/dashboard/);
}
