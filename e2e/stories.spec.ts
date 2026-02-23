import { test, expect } from "@playwright/test";
import { loginAs } from "./fixtures/auth";

test.describe("Stories", () => {
  let projectUrl: string;

  test.beforeAll(async ({ browser }) => {
    // Create a project once for all story tests
    const page = await browser.newPage();
    await loginAs(page);

    const projectName = `Stories test ${Date.now()}`;
    await page.getByRole("button", { name: /nouveau projet/i }).first().click();
    await page.getByLabel(/nom/i).fill(projectName);
    await page.getByRole("button", { name: /créer/i }).last().click();

    // Wait for project in sidebar, then click to navigate to it
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

  test("créer une story dans le backlog", async ({ page }) => {
    const storyTitle = `Story test ${Date.now()}`;

    // Open create story dialog
    await page.getByRole("button", { name: /créer une story/i }).first().click();
    await page.getByLabel(/titre/i).fill(storyTitle);
    await page.getByRole("button", { name: /créer/i }).last().click();

    await expect(page.getByText(storyTitle)).toBeVisible({ timeout: 10_000 });
  });

  test("envoyer une story au tableau depuis le backlog", async ({ page }) => {
    const storyTitle = `Board test ${Date.now()}`;

    // Create a story (defaults to BACKLOG status)
    await page.getByRole("button", { name: /créer une story/i }).first().click();
    await page.getByLabel(/titre/i).fill(storyTitle);
    await page.getByRole("dialog").getByRole("button", { name: "Créer une Story" }).click();
    await expect(page.getByText(storyTitle)).toBeVisible({ timeout: 10_000 });

    // Navigate to Backlog tab
    await page.getByRole("tab", { name: /backlog/i }).click();
    const storyRow = page.getByRole("row").filter({ hasText: storyTitle });
    await expect(storyRow).toBeVisible({ timeout: 5_000 });

    // Open the row's action menu and send to board
    await storyRow.getByRole("button").click();
    await page.getByRole("menuitem", { name: /envoyer au tableau/i }).click();

    // Story should no longer be in the backlog section (now in "Dans le tableau")
    await expect(page.getByText(/dans le tableau/i)).toBeVisible({ timeout: 5_000 });
  });

  test("ouvrir le détail d'une story affiche le titre", async ({ page }) => {
    const storyTitle = `Detail test ${Date.now()}`;
    await page.getByRole("button", { name: /créer une story/i }).first().click();
    await page.getByLabel(/titre/i).fill(storyTitle);
    await page.getByRole("button", { name: /créer/i }).last().click();
    await expect(page.getByText(storyTitle)).toBeVisible({ timeout: 10_000 });

    await page.getByText(storyTitle).click();

    // Dialog should show the title
    await expect(page.getByRole("dialog").getByText(storyTitle)).toBeVisible({ timeout: 5_000 });
  });
});
