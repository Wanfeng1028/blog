import { expect, test } from "@playwright/test";

const adminEmail = process.env.E2E_ADMIN_EMAIL ?? "admin@example.com";
const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? "Admin123456!";

test("login -> admin publish post -> visible in frontend", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("邮箱").fill(adminEmail);
  await page.getByLabel("密码").fill(adminPassword);
  await page.getByRole("button", { name: "登录" }).click();

  await expect(page).toHaveURL(/\/admin/);
  await page.goto("/admin/posts/new");

  await page.getByLabel("标题").fill(`E2E Post ${Date.now()}`);
  await page.getByLabel("摘要").fill("E2E summary for publish flow.");
  await page.getByLabel("标签（英文逗号分隔）").fill("e2e,test");
  await page.getByLabel("Markdown 内容").fill("# E2E Article\n\nThis is an e2e body.");
  await page.locator("select").first().selectOption("PUBLISHED");
  await page.getByRole("button", { name: "创建文章" }).click();

  await expect(page).toHaveURL("/admin/posts");
  await page.goto("/blog");
  await expect(page.getByText("E2E Post")).toBeVisible();
});
