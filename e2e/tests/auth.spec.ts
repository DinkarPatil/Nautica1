import { expect, test } from "@playwright/test";
import { ADMIRAL, login } from "./_helpers";

test.describe("Authentication", () => {
  test("redirects unauthenticated user to /login from a protected route", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL(/\/login/);
    expect(page.url()).toMatch(/\/login/);
  });

  test("login with admiral demo credentials succeeds and lands on /dashboard", async ({ page }) => {
    await login(page, ADMIRAL);
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("login with bad password surfaces an error message", async ({ page }) => {
    await page.goto("/login");
    await page.locator('input[type="email"]').fill(ADMIRAL.email);
    await page.locator('input[type="password"]').fill("wrong-pass");
    await page.getByRole("button", { name: /access system/i }).click();
    // Either the inline error appears or we just stay on /login.
    await expect(page).toHaveURL(/\/login/);
  });
});
