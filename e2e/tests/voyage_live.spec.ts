import { expect, test } from "@playwright/test";
import { login } from "./_helpers";

test.describe("Voyage live page", () => {
  test("opens v_001 and renders ship + route content from the backend", async ({ page }) => {
    await login(page);
    await page.goto("/voyage/v_001");
    // Server-rendered page; look for the ship name supplied by /api/voyages/v_001.
    await expect(page.locator("body")).toContainText("MV Nordic Falcon", { timeout: 30_000 });
    await expect(page.locator("body")).toContainText(/Algeciras/i);
    await expect(page.locator("body")).toContainText(/Rotterdam/i);
  });

  test("voyage live API returns valid telemetry via direct backend call", async ({ request, page }) => {
    await login(page);
    const cookies = await page.context().cookies();
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join("; ");
    const res = await request.get("http://127.0.0.1:8000/api/voyages/v_001/live", {
      headers: { Cookie: cookieHeader },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.voyageId).toBe("v_001");
    expect(["low", "medium", "high"]).toContain(body.riskBand);
    expect(typeof body.sog).toBe("number");
  });

  test("voyage brief API returns Vertex/stub-validated payload", async ({ request, page }) => {
    await login(page);
    const cookies = await page.context().cookies();
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join("; ");
    const res = await request.get("http://127.0.0.1:8000/api/voyages/v_001/brief", {
      headers: { Cookie: cookieHeader },
      timeout: 60_000,
    });
    expect(res.status()).toBe(200);
    const brief = await res.json();
    expect(typeof brief.recommendation).toBe("string");
    expect(brief.recommendation.length).toBeGreaterThan(0);
    expect(["low", "medium", "high"]).toContain(brief.riskBand);
    expect(Array.isArray(brief.riskFactors)).toBeTruthy();
  });
});
