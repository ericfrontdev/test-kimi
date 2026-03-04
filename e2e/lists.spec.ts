import { test, expect } from "@playwright/test";
import { loginAs } from "./fixtures/auth";

test.describe("Projets list-based", () => {
  let projectUrl: string;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await loginAs(page);

    const projectName = `Liste test ${Date.now()}`;
    await page.getByRole("button", { name: /nouveau projet/i }).first().click();
    await page.getByLabel(/nom/i).fill(projectName);

    // Select list-based type
    await page.getByRole("button", { name: /list-based/i }).click();

    await page.getByRole("button", { name: /créer/i }).last().click();

    await page.getByText(projectName).first().waitFor({ timeout: 10_000 });
    await page.getByText(projectName).first().click();
    await page.waitForURL(/\/project\//, { timeout: 10_000 });

    projectUrl = page.url();
    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    await loginAs(page);
    await page.goto(projectUrl);
  });

  test("projet list-based affiche les onglets Listes et Tableau", async ({ page }) => {
    await expect(page.getByRole("tab", { name: /listes/i })).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole("tab", { name: /tableau/i })).toBeVisible({ timeout: 5_000 });
  });

  test("créer une liste dans le backlog", async ({ page }) => {
    const listTitle = `Liste ${Date.now()}`;

    await page.getByRole("button", { name: /créer une liste/i }).first().click();
    await page.getByLabel(/titre/i).fill(listTitle);
    await page.getByRole("button", { name: /créer/i }).last().click();

    await expect(page.getByText(listTitle)).toBeVisible({ timeout: 10_000 });
  });

  test("envoyer une liste au tableau", async ({ page }) => {
    const listTitle = `Board liste ${Date.now()}`;

    // Créer la liste
    await page.getByRole("button", { name: /créer une liste/i }).first().click();
    await page.getByLabel(/titre/i).fill(listTitle);
    await page.getByRole("button", { name: /créer/i }).last().click();
    await expect(page.getByText(listTitle)).toBeVisible({ timeout: 10_000 });

    // Naviguer vers l'onglet Listes actuelles
    await page.getByRole("tab", { name: /listes/i }).click();

    // Trouver la rangée et envoyer au tableau
    const row = page.getByRole("row").filter({ hasText: listTitle });
    await expect(row).toBeVisible({ timeout: 5_000 });
    await row.getByRole("button").first().click();
    await page.getByRole("menuitem", { name: /envoyer au tableau/i }).click();

    await expect(page.getByText(/dans le tableau/i)).toBeVisible({ timeout: 5_000 });
  });

  test("ajouter un item à une liste", async ({ page }) => {
    const listTitle = `Items liste ${Date.now()}`;
    const itemTitle = `Item test ${Date.now()}`;

    // Créer la liste
    await page.getByRole("button", { name: /créer une liste/i }).first().click();
    await page.getByLabel(/titre/i).fill(listTitle);
    await page.getByRole("button", { name: /créer/i }).last().click();
    await expect(page.getByText(listTitle)).toBeVisible({ timeout: 10_000 });

    // Naviguer vers Listes actuelles pour accéder au détail
    await page.getByRole("tab", { name: /listes/i }).click();
    await page.getByRole("row").filter({ hasText: listTitle }).waitFor({ timeout: 5_000 });

    // Ouvrir la modal de détail en cliquant sur la rangée
    await page.getByRole("row").filter({ hasText: listTitle }).click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5_000 });

    // Ajouter un item
    await page.getByPlaceholder(/ajouter un item/i).fill(itemTitle);
    await page.getByPlaceholder(/ajouter un item/i).press("Enter");

    await expect(page.getByRole("dialog").getByText(itemTitle)).toBeVisible({ timeout: 5_000 });
  });

  test("cocher un item le marque comme terminé", async ({ page }) => {
    const listTitle = `Check liste ${Date.now()}`;
    const itemTitle = `Item à cocher ${Date.now()}`;

    // Créer liste + item
    await page.getByRole("button", { name: /créer une liste/i }).first().click();
    await page.getByLabel(/titre/i).fill(listTitle);
    await page.getByRole("button", { name: /créer/i }).last().click();
    await expect(page.getByText(listTitle)).toBeVisible({ timeout: 10_000 });

    // Naviguer vers Listes actuelles et ouvrir le détail
    await page.getByRole("tab", { name: /listes/i }).click();
    await page.getByRole("row").filter({ hasText: listTitle }).waitFor({ timeout: 5_000 });
    await page.getByRole("row").filter({ hasText: listTitle }).click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5_000 });

    await page.getByPlaceholder(/ajouter un item/i).fill(itemTitle);
    await page.getByPlaceholder(/ajouter un item/i).press("Enter");
    await expect(page.getByRole("dialog").getByText(itemTitle)).toBeVisible({ timeout: 5_000 });

    // Cocher l'item
    const itemRow = page.getByRole("dialog").locator("div").filter({ hasText: itemTitle }).first();
    await itemRow.getByRole("checkbox").click();

    // Le texte doit être barré (line-through)
    await expect(
      page.getByRole("dialog").locator("span.line-through", { hasText: itemTitle })
    ).toBeVisible({ timeout: 5_000 });
  });
});
