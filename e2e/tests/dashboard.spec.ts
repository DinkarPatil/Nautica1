import { expect, test } from "@playwright/test";
import { login } from "./_helpers";

test("dashboard renders Executive Bridge heading after login", async ({ page }) => {
  await login(page);
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole("heading", { name: /Executive Bridge/i })).toBeVisible({
    timeout: 30_000,
  });
});
