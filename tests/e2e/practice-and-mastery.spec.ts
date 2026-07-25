import { expect, test } from "@playwright/test";

import { bookReviewPathRegex } from "./helpers/url-expectations";

test("child sees expanded deterministic practice types and answers one item", async ({ page }) => {
  await page.goto("/parent/books/new");

  await page.getByLabel("绘本标题").fill(`Practice Book ${Date.now()}`);
  await page.getByLabel("页面图片").setInputFiles({
    name: "practice-page.png",
    mimeType: "image/png",
    buffer: Buffer.from("practice-page"),
  });
  await page.getByRole("button", { name: "创建草稿并模拟识别" }).click();
  await expect(page).toHaveURL(bookReviewPathRegex, { timeout: 15_000 });

  await page.getByRole("button", { name: "确认这一页" }).click();
  await expect(page.getByText("已确认内容")).toBeVisible();

  await page.goto("/child/today");
  await expect(page.getByRole("heading", { name: "今日练习" })).toBeVisible({ timeout: 15_000 });
  // Total count depends on seed DB + confirmed books and getTodayPractice limit (not fixed at 4).
  await expect(page.getByText(/第\s*1\s*\/\s*\d+\s*题/)).toBeVisible();

  await page.getByRole("button", { name: "下一题" }).click();
  await expect(page.getByText(/第\s*2\s*\/\s*\d+\s*题/)).toBeVisible();
  await page.getByRole("button", { name: "上一题" }).click();
  await expect(page.getByText(/第\s*1\s*\/\s*\d+\s*题/)).toBeVisible();

  await expect(page.getByLabel("造句练习")).toBeVisible();

  await page.getByLabel("造句答案").fill("I write the page about a good book.");
  await page.getByRole("button", { name: "提交造句" }).click();

  await expect(page.getByText("答对了")).toBeVisible();
  const feedback = page.getByRole("region", { name: "作答反馈" });
  await expect(feedback.getByText(/掌握分：\d+/)).toBeVisible();
  await expect(feedback.getByText(/下次复习：/)).toBeVisible();
});
