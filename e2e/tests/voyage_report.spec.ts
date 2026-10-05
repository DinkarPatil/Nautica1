import { expect, test } from "@playwright/test";
import { login } from "./_helpers";

test("voyage report page renders backend-supplied summary + AI conclusion", async ({ page }) => {
  await login(page);
  await page.goto("/voyage/v_001/report");
  await expect(page.locator("body")).toContainText(
    /voyage report|delay attribution|risk events|final status|summary|scorecard/i,
    { timeout: 60_000 },
  );
});

test("voyage report endpoint returns full envelope", async ({ request, page }) => {
  await login(page);
  const cookies = await page.context().cookies();
  const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join("; ");
  const res = await request.get("http://127.0.0.1:8000/api/voyages/v_001/report", {
    headers: { Cookie: cookieHeader },
    timeout: 60_000,
  });
  expect(res.status()).toBe(200);
  const report = await res.json();
  expect(report.voyage.id).toBe("v_001");
  expect(typeof report.summary).toBe("string");
  expect(typeof report.aiConclusion).toBe("string");
  expect(report.attribution.factors.length).toBe(4);
});
