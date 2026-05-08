import { expect, test } from "@playwright/test";

test("child sees expanded deterministic practice types and answers one item", async ({ page }) => {
  await page.goto("/parent/books/new");

  await page.getByLabel("绘本标题").fill(`Practice Book ${Date.now()}`);
  await page.getByLabel("页面图片").setInputFiles({
    name: "practice-page.png",
    mimeType: "image/png",
    buffer: Buffer.from("practice-page"),
  });
  await page.getByRole("button", { name: "创建草稿并模拟识别" }).click();
  await expect(page).toHaveURL(/\/parent\/books\/book_\d+\/review/);

  await page.getByRole("button", { name: "确认这一页" }).click();
  await expect(page.getByText("已确认内容")).toBeVisible();

  await page.goto("/child/today");
  await expect(page.getByRole("heading", { name: "今日练习" })).toBeVisible();
  await expect(page.getByLabel("填空练习").first()).toBeVisible();
  await expect(page.getByLabel("看图说句子练习").first()).toBeVisible();
  await expect(page.getByLabel("语法找错练习").first()).toBeVisible();
  await expect(page.getByLabel("造句练习").first()).toBeVisible();

  await page.getByLabel("造句答案").first().fill("I write the page about a good book.");
  await page.getByRole("button", { name: "提交造句" }).first().click();

  await expect(page.getByText("答对了")).toBeVisible();
  await expect(page.getByText(/掌握分：\d+/)).toBeVisible();
  await expect(page.getByText(/下次复习：/)).toBeVisible();
});
