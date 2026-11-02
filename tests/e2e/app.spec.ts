import { expect, test, type Page } from "@playwright/test";

async function start(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: /Commencer directement/ }).click();
  await expect(page.getByRole("heading", { name: /Programme du jour/ })).toBeVisible();
}

test("onboarding puis programme du jour", async ({ page }) => {
  await start(page);
  await expect(page.getByText("A. Grammaire et vocabulaire", { exact: false })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: /Programme du jour/ })).toBeVisible();
});

test("leçon : explication, exercices, correction et score sauvegardé", async ({ page }) => {
  await start(page);
  await page.goto("/apprendre/present-simple-continuous");
  await expect(page.getByRole("heading", { name: "1. L'explication" })).toBeVisible();
  await page.getByRole("button", { name: "Commencer les exercices" }).click();
  // 1er exercice : QCM « Listen! The baby ___. » → is crying
  await page.getByRole("button", { name: /is crying/ }).click();
  await expect(page.getByText("Correct !")).toBeVisible();
  await page.getByRole("button", { name: "Continuer" }).click();
  // 2e : QCM, mauvaise réponse volontaire → l'exercice revient en fin de série
  await page.getByRole("button", { name: /is living/ }).click();
  await expect(page.getByText("Pas tout à fait")).toBeVisible();
  await expect(page.getByText(/Bonne réponse/)).toBeVisible();
  await page.getByRole("button", { name: "Continuer" }).click();
  // 3e : phrase à trous
  await page.getByLabel("Trou 1").fill("don't like");
  await page.getByRole("button", { name: /Vérifier/ }).click();
  await expect(page.getByText("Correct !")).toBeVisible();
  // Parcourir le reste en répondant au plus simple
  for (let i = 0; i < 90; i++) {
    const next = page.getByRole("button", { name: /Continuer|Voir le résultat/ });
    if (await next.isVisible()) {
      await next.click();
      continue;
    }
    if (await page.getByText("réussis du premier coup").isVisible()) break;
    const mcqOption = page.locator("button:has(span:text-is('A'))").first();
    if (await mcqOption.isVisible()) {
      await mcqOption.click();
      continue;
    }
    const field = page.locator("textarea, input[aria-label^='Trou'], input[aria-label='Correction']").first();
    const pool = page.locator("div.flex.flex-wrap.gap-2[lang=en]:not([aria-label]) > button:not([disabled])");
    if (await page.getByText("Touchez les mots dans l'ordre").isVisible()) {
      const n = await pool.count();
      for (let k = 0; k < n; k++) await pool.first().click();
    } else if (await page.getByText("Touchez le mot incorrect").isVisible()) {
      await page.locator("p[lang=en] > button").first().click();
      await page.getByLabel("Correction").fill("x");
    } else if (await page.getByLabel("Trou 1").isVisible()) {
      const holes = page.locator("input[aria-label^='Trou']");
      for (let k = 0; k < (await holes.count()); k++) await holes.nth(k).fill("is");
    } else if (await field.isVisible()) {
      await field.fill("I usually work but now I am working");
    }
    await page.getByRole("button", { name: /Vérifier/ }).click();
  }
  await expect(page.getByText("réussis du premier coup")).toBeVisible();
  await page.goto("/revisions");
  await expect(page.getByText(/erreur.* de grammaire en suivi/)).toBeVisible();
  await page.goto("/apprendre");
  await page.reload();
  await expect(page.locator("a[href='/apprendre/present-simple-continuous']")).toContainText("%");
});

test("leçon verrouillée tant que les prérequis ne sont pas acquis", async ({ page }) => {
  await start(page);
  await page.goto("/apprendre/past-perfect");
  await expect(page.getByText(/Elle se débloque quand l'examen blanc/)).toBeVisible();
});

test("nouveaux mots puis session de répétition espacée", async ({ page }) => {
  await start(page);
  await page.goto("/revisions/nouveaux");
  for (let i = 0; i < 9; i++) await page.getByRole("button", { name: "Mot suivant" }).click();
  await page.getByRole("button", { name: /Ajouter ces mots/ }).click();
  await expect(page.getByText("10 mots ajoutés à votre carnet")).toBeVisible();
  await page.getByRole("link", { name: "Les réviser maintenant" }).click();
  await expect(page.getByText("Que signifie ce mot ?")).toBeVisible();
  await page.getByRole("button", { name: "Afficher la réponse" }).click();
  await page.getByRole("button", { name: /Correct/ }).click();
  await expect(page.getByText(/restantes/)).toBeVisible();
  await page.goto("/revisions/carnet");
  await expect(page.getByText("commute")).toBeVisible();
  await page.reload();
  await expect(page.getByText("commute")).toBeVisible();
});

test("écoute : questions, transcription et dictionnaire intégré", async ({ page }) => {
  await start(page);
  await page.goto("/ecouter/coffee-shop");
  await expect(page.getByRole("button", { name: "Écouter le dialogue" })).toBeVisible();
  await expect(page.getByText(/s'affiche après vos réponses/)).toBeVisible();
  await page.getByRole("button", { name: "Large", exact: true }).click();
  await page.getByRole("button", { name: "Oat milk", exact: true }).click();
  await page.getByRole("button", { name: "He is in a hurry" }).click();
  await page.getByRole("button", { name: "£6.20" }).click();
  await page.getByRole("button", { name: "Valider mes réponses" }).click();
  await expect(page.getByText("Score : 100 %")).toBeVisible();
  await page.getByRole("button", { name: "hurry", exact: true }).first().click();
  await expect(page.getByRole("dialog", { name: /Dictionnaire/ })).toBeVisible();
});

test("lecture : clic sur un mot inconnu et ajout au carnet personnel", async ({ page }) => {
  await start(page);
  await page.goto("/lire/four-day-week");
  await page.getByRole("button", { name: "Supporters", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: /Dictionnaire/ });
  await expect(dialog).toBeVisible();
  const add = dialog.getByRole("button", { name: "Ajouter au carnet" }).first();
  if (await add.isVisible()) await add.click();
  else {
    await dialog.getByLabel("Traduction française").fill("partisans");
    await dialog.getByRole("button", { name: "Ajouter" }).click();
  }
  await page.goto("/revisions/carnet");
  await expect(page.getByText(/supporters/i)).toBeVisible();
});

test("oral : scénario guidé avec correction des erreurs (saisie clavier)", async ({ page }) => {
  await start(page);
  await page.goto("/parler/scenario/introduce-yourself");
  await page.getByLabel("Votre réponse").fill("Hi Alex, my name is Julie. I am agree to meet you.");
  await page.getByRole("button", { name: "Envoyer" }).click();
  await expect(page.getByText("Correction du professeur")).toBeVisible();
  await expect(page.getByText(/agree.* est un verbe/)).toBeVisible();
  await expect(page.getByText("Une formulation naturelle")).toBeVisible();
  await page.getByRole("button", { name: "Continuer" }).click();
  await expect(page.getByText("Where are you from?").first()).toBeVisible();
});

test("conversation libre hors IA", async ({ page }) => {
  await start(page);
  await page.goto("/parler/libre/daily-life");
  await page.getByLabel("Votre réponse").fill("I get up at seven and he go to work by tram because it is fast.");
  await page.getByRole("button", { name: "Envoyer" }).click();
  await expect(page.getByText(/point.* à corriger/)).toBeVisible();
  await expect(page.getByText("he goes", { exact: true })).toBeVisible();
});

test("écriture : correction automatique détaillée", async ({ page }) => {
  await start(page);
  await page.goto("/ecrire/w-weekend");
  await page.getByLabel("Votre texte en anglais").fill("Last weekend I went to the beach with my friends. On Saturday we played volleyball and we had lunch in a small restaurant. I loved it because it was relaxing. On Sunday I watched a film at home and I cooked dinner for my family.");
  await page.getByRole("button", { name: "Faire corriger" }).click();
  await expect(page.getByText(/Estimation :/)).toBeVisible();
  await expect(page.getByText("Consigne respectée")).toBeVisible();
});

test("test de positionnement complet et bilan", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Passer le test de positionnement/ }).click();
  await page.getByRole("button", { name: "Commencer" }).click();
  for (let part = 0; part < 6; part++) {
    const radios = page.getByRole("radiogroup");
    const n = await radios.count();
    for (let i = 0; i < n; i++) await radios.nth(i).getByRole("radio").first().click();
    const text = page.getByLabel(/Votre texte en anglais|Votre réponse/);
    if (await text.isVisible()) {
      await text.fill("My name is Paul and I live in Bordeaux. I work in a bank and I want to improve my English because I travel a lot for my job.");
      const send = page.getByRole("button", { name: "Envoyer" });
      if (await send.isVisible()) await send.click();
    }
    await page.getByRole("button", { name: /Partie suivante|Terminer et voir mon bilan/ }).click();
  }
  await expect(page.getByRole("heading", { name: "Votre profil de départ" })).toBeVisible();
  await expect(page.getByText("Points forts")).toBeVisible();
  await page.getByRole("button", { name: /Voir mon programme/ }).click();
  await page.goto("/progression");
  await expect(page.getByText(/Passé le/)).toBeVisible();
});

test("réglages : thème sombre et export", async ({ page }) => {
  await start(page);
  await page.goto("/reglages");
  await page.getByLabel("Thème").selectOption("dark");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exporter mes progrès" }).click();
  expect((await download).suggestedFilename()).toMatch(/english-coach-sauvegarde/);
});

test("navigation : toutes les rubriques accessibles", async ({ page, isMobile }) => {
  await start(page);
  const labels = ["Apprendre", "Écouter", "Parler", "Lire", "Business English", "Révisions", "Progression"];
  for (const l of labels) {
    if (isMobile) {
      const direct = page.getByRole("navigation", { name: "Navigation principale" }).getByRole("link", { name: l, exact: true });
      if (await direct.isVisible()) await direct.click();
      else {
        await page.getByRole("button", { name: "Plus" }).click();
        await page.getByRole("dialog").getByRole("link", { name: l }).click();
      }
    } else await page.getByRole("navigation", { name: "Navigation principale" }).getByRole("link", { name: l, exact: true }).first().click();
    await expect(page.locator("h1").first()).toBeVisible();
  }
});
