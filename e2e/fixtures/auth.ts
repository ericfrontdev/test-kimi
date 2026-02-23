import { type Page } from "@playwright/test";
import { TEST_USER } from "./test-config";

export async function loginAs(page: Page, email = TEST_USER.email, password = TEST_USER.password) {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
  // Wait for redirect to dashboard
  await page.waitForURL(/\/(dashboard|project|$)/, { timeout: 10_000 });
}
