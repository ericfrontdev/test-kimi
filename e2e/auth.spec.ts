import { test, expect } from "@playwright/test";
import { TEST_USER } from "./fixtures/test-config";

test.describe("Authentification", () => {
  test("login réussi redirige vers le dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(TEST_USER.email);
    await page.getByLabel(/password/i).fill(TEST_USER.password);
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/(dashboard|project|$)/, { timeout: 10_000 });
  });

  test("mauvais mot de passe affiche une erreur", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(TEST_USER.email);
    await page.getByLabel(/password/i).fill("wrong-password");
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page.locator("form p.text-destructive")).toBeVisible({ timeout: 5_000 });
  });

  test("logout redirige vers /login", async ({ page }) => {
    // Login first
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(TEST_USER.email);
    await page.getByLabel(/password/i).fill(TEST_USER.password);
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL(/\/(dashboard|project|$)/, { timeout: 10_000 });

    // Open user menu and logout
    await page.getByRole("button", { name: new RegExp(TEST_USER.name + "|utilisateur", "i") }).first().click();
    await page.getByRole("menuitem", { name: /déconnexion/i }).click();

    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });
});
