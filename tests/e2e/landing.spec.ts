import { expect, test } from "@playwright/test";

test("landing page links to parent and child spaces", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "家庭自用英语绘本学习原型" })).toBeVisible();
  await expect(page.getByRole("link", { name: "进入家长端" })).toHaveAttribute(
    "href",
    "/parent/dashboard",
  );
  await expect(page.getByRole("link", { name: "进入孩子端" })).toHaveAttribute(
    "href",
    "/child/today",
  );
});

test("parent dashboard renders foundation metrics", async ({ page }) => {
  await page.goto("/parent/dashboard");

  await expect(page.getByRole("heading", { name: "家长端" })).toBeVisible();
  await expect(page.getByText("待校对绘本")).toBeVisible();
  await expect(page.getByText("低掌握度知识点")).toBeVisible();
});

test("child today page renders bilingual practice shell", async ({ page }) => {
  await page.goto("/child/today");

  await expect(page.getByRole("heading", { name: "今日练习" })).toBeVisible();
  await expect(page.getByText("Ready?")).toBeVisible();
  await expect(page.getByText("今天先从确认绘本里的练习开始")).toBeVisible();
});
