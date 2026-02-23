import { test, expect } from "@playwright/test";
import { loginAs } from "./fixtures/auth";

test.describe("Projets", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page);
  });

  test("créer un projet et le voir dans la liste", async ({ page }) => {
    const projectName = `Projet test ${Date.now()}`;

    // Open create project dialog
    await page.getByRole("button", { name: /nouveau projet/i }).first().click();
    await page.getByLabel(/nom/i).fill(projectName);
    await page.getByRole("button", { name: /créer/i }).last().click();

    // Project should appear in sidebar list
    await expect(page.getByText(projectName)).toBeVisible({ timeout: 10_000 });
  });

  test("naviguer vers un projet existant affiche les onglets", async ({ page }) => {
    const projectName = `Nav test ${Date.now()}`;

    // Create the project
    await page.getByRole("button", { name: /nouveau projet/i }).first().click();
    await page.getByLabel(/nom/i).fill(projectName);
    await page.getByRole("button", { name: /créer/i }).last().click();

    // Wait for project in sidebar, then click to navigate
    await page.getByText(projectName).first().waitFor({ timeout: 10_000 });
    await page.getByText(projectName).first().click();
    await page.waitForURL(/\/project\//, { timeout: 10_000 });

    // Should see the main tabs
    await expect(page.getByRole("tab", { name: /backlog/i }).or(
      page.getByText(/backlog/i)
    )).toBeVisible();
  });
});
