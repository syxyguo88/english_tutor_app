import { expect, test } from "@playwright/test";

test("parent creates and confirms a mock-ingested book", async ({ page }) => {
  await page.goto("/parent/books/new");

  await expect(page.getByRole("heading", { name: "上传绘本" })).toBeVisible();
  await page.getByLabel("绘本标题").fill("Playwright Picture Book");
  await page.getByLabel("标签").fill("animals, school");
  await page.getByLabel("页面图片").setInputFiles({
    name: "page-one.png",
    mimeType: "image/png",
    buffer: Buffer.from("mock-page-one"),
  });

  await page.getByRole("button", { name: "创建草稿并模拟识别" }).click();

  await expect(page).toHaveURL(/\/parent\/books\/book_\d+\/review/);
  await expect(page.getByRole("heading", { name: "校对：Playwright Picture Book" })).toBeVisible();
  await expect(page.getByText("未确认 OCR 草稿不会进入正式练习")).toBeVisible();
  await expect(page.getByLabel("第 1 页句子 1")).toHaveValue("I can see page one.");

  await page.getByRole("button", { name: "确认这一页" }).click();

  await expect(page.getByText("已确认内容")).toBeVisible();
  await expect(page.getByText("I can see page one.")).toBeVisible();
  await expect(page.getByText("知识项：page")).toBeVisible();
  await expect(page.getByText("知识项：good book")).toBeVisible();
});
