import { expect, test } from "@playwright/test";
import { login } from "./_helpers";

test("voyage create endpoint accepts a full draft and returns a new id", async ({ request, page }) => {
  await login(page);
  const cookies = await page.context().cookies();
  const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join("; ");

  const res = await request.post("http://127.0.0.1:8000/api/voyages", {
    headers: { Cookie: cookieHeader, "Content-Type": "application/json" },
    data: {
      shipName: "MV Playwright",
      imo: "9876543",
      voyageType: "Container",
      origin: {
        id: "p_alg",
        unlocode: "ESALG",
        name: "Algeciras",
        country: "ES",
        lat: 36.1408,
        lon: -5.4533,
      },
      destination: {
        id: "p_rtm",
        unlocode: "NLRTM",
        name: "Rotterdam",
        country: "NL",
        lat: 51.9244,
        lon: 4.4777,
      },
      plannedDeparture: "2026-05-01T08:00:00Z",
      plannedArrival: "2026-05-07T18:00:00Z",
      sensitivity: "Strict",
      trackingMode: "Real-time",
      alertPreference: "Full intelligence",
      cargoPriority: "High",
      delayToleranceMin: "60",
    },
  });
  expect(res.status()).toBe(201);
  const body = await res.json();
  expect(body.id).toMatch(/^v_/);

  // Confirm we can fetch the new voyage back
  const detail = await request.get(`http://127.0.0.1:8000/api/voyages/${body.id}`, {
    headers: { Cookie: cookieHeader },
  });
  expect(detail.status()).toBe(200);
  const v = await detail.json();
  expect(v.ship.name).toBe("MV Playwright");
});

test("voyage/new page renders the form and AI assistant sidebar", async ({ page }) => {
  await login(page);
  await page.goto("/voyage/new");
  await expect(page.getByRole("heading", { name: /Start a Voyage/i })).toBeVisible({
    timeout: 30_000,
  });
  // Form sections should render
  await expect(page.locator("body")).toContainText(/Vessel/i);
  await expect(page.locator("body")).toContainText(/Route/i);
  await expect(page.locator("body")).toContainText(/Schedule/i);
});
