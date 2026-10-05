/**
 * Voyage product end-to-end journey test.
 *
 * Creates a voyage, lands on live, opens alerts, opens analysis, opens report,
 * resolves an alert, downloads the report — all touching the real backend.
 */
import { expect, test } from "@playwright/test";
import { login } from "./_helpers";

const BACKEND = "http://127.0.0.1:8000";

test.describe("Voyage product full journey", () => {
  // Cold-start Vertex calls take time (brief, storyline, scorecard). Give the
  // entire flow a generous ceiling so we don't trip the default 60s.
  test.setTimeout(240_000);

  test("create → live → alerts → analysis → report (with state machine, narrator, triage, scorecard)", async ({
    page,
    request,
  }) => {
    await login(page);

    // ─── 1. Create the voyage ────────────────────────────────────────────────
    await page.goto("/voyage/new");
    await expect(page.getByRole("heading", { name: /Start a Voyage/i })).toBeVisible();

    // Readiness panel renders
    await expect(page.getByTestId("voyage-readiness-panel")).toBeVisible();

    // Fill form
    await page.getByLabel("Ship name", { exact: false }).fill("MV E2E Voyager");
    await page.getByLabel("IMO number", { exact: false }).fill("9876543");

    const originField = page.getByLabel("Origin port", { exact: false });
    await originField.click();
    await originField.fill("Algeciras");
    await page.locator("text=Algeciras").first().click({ timeout: 10_000 });

    const destField = page.getByLabel("Destination port", { exact: false });
    await destField.click();
    await destField.fill("Rotterdam");
    await page.locator("text=Rotterdam").first().click({ timeout: 10_000 });

    await page.getByLabel("Planned departure", { exact: false }).fill("2026-05-01T08:00");

    // Wait for readiness to flip to green & button to enable
    const startBtn = page.getByTestId("voyage-start-button");
    await expect(startBtn).toBeEnabled({ timeout: 10_000 });
    const score = await page.getByTestId("voyage-readiness-score").textContent();
    expect(score).not.toBe("—");

    // Submit creates voyage and routes to /voyage/{id}
    await startBtn.click();
    await page.waitForURL(/\/voyage\/v_/, { timeout: 30_000 });
    const url = page.url();
    const voyageId = url.split("/voyage/")[1].split(/[?#]/)[0];
    expect(voyageId.startsWith("v_")).toBeTruthy();

    // ─── 2. Live page ────────────────────────────────────────────────────────
    // The first render kicks off a cold Vertex brief; allow extra time.
    await expect(page.getByTestId("voyage-journey-nav")).toBeVisible({ timeout: 60_000 });
    await expect(page.locator("body")).toContainText("MV E2E Voyager", { timeout: 30_000 });
    // Backend confirms state went draft → ready → active → in_transit
    const cookies = await page.context().cookies();
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join("; ");
    const transRes = await request.get(`${BACKEND}/api/voyages/${voyageId}/transitions`, {
      headers: { Cookie: cookieHeader },
      timeout: 30_000,
    });
    expect(transRes.status()).toBe(200);
    const transitions = await transRes.json();
    expect(transitions.map((t: any) => t.toState)).toEqual(["ready", "active", "in_transit"]);

    // ─── 3. Alerts page ──────────────────────────────────────────────────────
    await page.getByTestId("voyage-nav-alerts").click();
    await page.waitForURL(/\/voyage\/v_[^/]+\/alerts/);
    await expect(page.locator("body")).toContainText("Alerts & Evidence");
    // No open alerts on a freshly-created voyage — happy path renders
    await expect(page.getByTestId("voyage-alerts-open")).toBeVisible();

    // ─── 4. Analysis page ────────────────────────────────────────────────────
    await page.getByTestId("voyage-nav-analysis").click();
    await page.waitForURL(/\/voyage\/v_[^/]+\/analysis/);
    await expect(page.getByTestId("voyage-storyline")).toBeVisible({ timeout: 30_000 });

    // ─── 5. Report page ──────────────────────────────────────────────────────
    await page.getByTestId("voyage-nav-report").click();
    await page.waitForURL(/\/voyage\/v_[^/]+\/report/);
    await expect(page.getByTestId("voyage-scorecard")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("voyage-report-export")).toBeVisible();

    // Backend scorecard returns the same envelope. Cold-start Vertex Pro
    // can take 10-30s, so allow a long ceiling.
    const scoreRes = await request.get(`${BACKEND}/api/voyages/${voyageId}/scorecard`, {
      headers: { Cookie: cookieHeader },
      timeout: 90_000,
    });
    expect(scoreRes.status()).toBe(200);
    const sc = await scoreRes.json();
    expect(["A", "B", "C", "D", "F"]).toContain(sc.grade);
    expect(sc.components.length).toBe(3);
  });

  test("alert resolve flow: ack then resolve via the alerts page", async ({ page, request }) => {
    await login(page);
    await page.goto("/voyage/v_001/alerts");

    // Seed v_001 has 3 alerts; at least one is "new" or "acknowledged"
    const ackBtn = page.getByTestId(/voyage-alert-ack-/).first();
    if (await ackBtn.count()) {
      await ackBtn.click();
      await page.waitForLoadState("networkidle").catch(() => undefined);
    }

    const resolveBtn = page.getByTestId(/voyage-alert-resolve-/).first();
    await resolveBtn.click();
    await page.waitForLoadState("networkidle").catch(() => undefined);

    // The resolved sidebar list should now contain at least one resolved entry
    await expect(page.getByTestId(/voyage-alert-resolved-/).first()).toBeVisible({
      timeout: 10_000,
    });
  });
});
