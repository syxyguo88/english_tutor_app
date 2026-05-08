import { expect, test } from "@playwright/test";

test("child answers a generated fill-blank practice item and sees mastery feedback", async ({
  page,
}) => {
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
  const prompt = page.getByRole("heading", { name: /____/ }).first();
  await expect(prompt).toBeVisible();
  const promptText = (await prompt.textContent()) ?? "";
  const answer = promptText.includes("This is a ____") ? "good book" : "page";

  await page.getByLabel("答案").fill(answer);
  await page.getByRole("button", { name: "提交答案" }).click();

  await expect(page.getByText("答对了")).toBeVisible();
  await expect(page.getByText(/掌握分：\d+/)).toBeVisible();
  await expect(page.getByText(/下次复习：/)).toBeVisible();
});
