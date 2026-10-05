/**
 * Smoke tests over the backend API directly — useful in CI to catch shape
 * regressions even when the dev server is slow to compile.
 */
import { expect, test } from "@playwright/test";
import { login } from "./_helpers";

const BACKEND = "http://127.0.0.1:8000";

test.describe("Backend smoke (via Playwright request fixture)", () => {
  test("health endpoint returns ok", async ({ request }) => {
    const res = await request.get(`${BACKEND}/api/health`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.db).toBe(true);
  });

  test("login returns access + refresh tokens", async ({ request }) => {
    const res = await request.post(`${BACKEND}/api/auth/login`, {
      data: { email: "admiral@glimmora.com", password: "demo" },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.access_token).toBeTruthy();
    expect(body.refresh_token).toBeTruthy();
    expect(body.user.role).toBe("executive");
  });

  test("dashboard kpis surface aggregates", async ({ request, page }) => {
    await login(page);
    const cookies = await page.context().cookies();
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join("; ");
    const res = await request.get(`${BACKEND}/api/dashboard/kpis`, {
      headers: { Cookie: cookieHeader },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.totalVessels).toBe(100);
    expect(body.riskAlerts).toBeGreaterThan(0);
  });

  test("sanctions screening returns the standard envelope", async ({ request, page }) => {
    await login(page);
    const cookies = await page.context().cookies();
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join("; ");
    const res = await request.post(`${BACKEND}/api/risk/sanctions/screen`, {
      headers: { Cookie: cookieHeader, "Content-Type": "application/json" },
      data: { query: "MV Volga Express", type: "vessel" },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("matched");
    expect(body).toHaveProperty("hits");
    expect(body).toHaveProperty("explanation");
  });
});
