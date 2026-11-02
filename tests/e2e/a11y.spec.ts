import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const PAGES = ["/", "/apprendre", "/apprendre/present-simple-continuous", "/ecouter", "/ecouter/coffee-shop", "/parler", "/parler/scenario/restaurant", "/lire/four-day-week", "/business", "/revisions", "/revisions/carnet", "/progression", "/reglages", "/test/positionnement"];

for (const scheme of ["light", "dark"] as const) {
  test(`accessibilité WCAG 2.2 AA (${scheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto("/");
    await page.getByRole("button", { name: /Commencer directement/ }).click();
    const problems: string[] = [];
    for (const path of PAGES) {
      await page.goto(path);
      await page.waitForTimeout(300);
      const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
      for (const v of r.violations) problems.push(`${path} · ${v.id} · ${v.nodes.slice(0, 2).map((n) => n.target.join(" ")).join(" | ")}`);
    }
    expect(problems, problems.join("\n")).toEqual([]);
  });
}
