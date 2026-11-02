import { expect, test } from "@playwright/test";

test("fonctionne hors connexion une fois chargée (PWA)", async ({ page, context, browserName }) => {
  test.skip(browserName !== "chromium");
  await page.goto("/");
  await page.getByRole("button", { name: /Commencer directement/ }).click();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await page.waitForTimeout(500);
  await context.setOffline(true);
  await page.goto("/apprendre/present-simple-continuous");
  await expect(page.getByRole("heading", { name: "1. L'explication" })).toBeVisible();
  await page.goto("/lire/four-day-week");
  await expect(page.getByRole("heading", { name: /four-day week/ })).toBeVisible();
  await context.setOffline(false);
});
