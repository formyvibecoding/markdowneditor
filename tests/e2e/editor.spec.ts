/**
 * Markdown 编辑器 E2E 测试
 */

import { test, expect } from '@playwright/test';

test.describe('Markdown 编辑器', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('应该正确加载页面', async ({ page }) => {
    await expect(page).toHaveTitle('Markdown 编辑器');
    await expect(page.locator('#markdown-input')).toBeVisible();
    await expect(page.locator('#preview-new-tab-btn')).toBeVisible();
    await expect(page.locator('#download-markdown-btn')).toBeVisible();
    await expect(page.locator('#history-toggle-btn')).toBeVisible();
  });

  test('历史记录默认关闭并支持 ESC 关闭', async ({ page }) => {
    const overlay = page.locator('#history-overlay');
    await expect(overlay).toBeHidden();

    await page.locator('#history-toggle-btn').click();
    await expect(overlay).toBeVisible();
    await expect(page.locator('#history-panel')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(overlay).toBeHidden();
  });

  test('初始打开时编辑器应为空', async ({ page }) => {
    const textarea = page.locator('#markdown-input');
    await expect(textarea).toHaveValue('');
  });

  test('应该允许用户编辑内容', async ({ page }) => {
    const textarea = page.locator('#markdown-input');

    // 清空并输入新内容
    await textarea.fill('# 测试标题\n\n这是测试内容');

    const content = await textarea.inputValue();
    expect(content).toBe('# 测试标题\n\n这是测试内容');
  });

  test('应该在新标签页打开预览', async ({ page, context }) => {
    await page.locator('#markdown-input').fill('# 测试标题');

    // 监听新页面打开
    const pagePromise = context.waitForEvent('page');

    // 点击预览按钮
    await page.locator('#preview-new-tab-btn').click();

    // 等待新页面
    const newPage = await pagePromise;
    await newPage.waitForLoadState();

    // 验证预览页面内容
    await expect(newPage).toHaveTitle('Markdown 预览');
    await expect(newPage.locator('.markdown-body')).toBeVisible();
  });

  test('预览页面应该包含 PDF 下载按钮', async ({ page, context }) => {
    await page.locator('#markdown-input').fill('# 测试标题');

    const pagePromise = context.waitForEvent('page');
    await page.locator('#preview-new-tab-btn').click();
    const newPage = await pagePromise;
    await newPage.waitForLoadState();

    // 验证两个 PDF 按钮存在
    await expect(newPage.locator('#download-pdf-btn')).toBeVisible();
    await expect(
      newPage.locator('#download-single-page-pdf-btn')
    ).toBeVisible();

    // 验证按钮文案统一
    await expect(newPage.locator('#download-pdf-btn')).toHaveText(
      '下载 PDF（分页）'
    );
    await expect(newPage.locator('#download-single-page-pdf-btn')).toHaveText(
      '保存 PDF（单页）'
    );
  });

  test('分屏切换后预览按钮应保留图标', async ({ page }) => {
    await page.setViewportSize({ width: 1700, height: 900 });
    await page.reload();

    await page.locator('#markdown-input').fill('# 测试标题');
    await expect(
      page.locator('#preview-new-tab-btn .app-button__icon svg')
    ).toBeVisible();

    await page.locator('#preview-new-tab-btn').click();
    await expect(page.locator('#preview-pane')).toBeVisible();
    await expect(page.locator('#preview-new-tab-btn')).toContainText('编辑');
    await expect(
      page.locator('#preview-new-tab-btn .app-button__icon svg')
    ).toBeVisible();
  });

  test('空内容时下载应该显示内部提示', async ({ page }) => {
    const textarea = page.locator('#markdown-input');

    await textarea.fill('');
    await textarea.fill('   ');

    let hasDialog = false;
    page.on('dialog', async dialog => {
      hasDialog = true;
      await dialog.dismiss();
    });

    await page.locator('#download-markdown-btn').click();
    await expect(page.locator('.app-toast-error').last()).toContainText(
      '编辑器内容为空'
    );
    expect(hasDialog).toBe(false);
  });

  test('预览未打开时，1:2 视图降级不应提示', async ({ page }) => {
    await page.setViewportSize({ width: 1700, height: 900 });
    await page.reload();

    await page.setViewportSize({ width: 1500, height: 900 });
    await page.waitForTimeout(300);

    await expect(page.locator('.app-toast')).toHaveCount(0);
  });

  test('预览打开时，1:2 视图降级应提示并保持预览打开', async ({ page }) => {
    await page.setViewportSize({ width: 1700, height: 900 });
    await page.reload();

    await page.locator('#markdown-input').fill('# 测试标题');
    await page.locator('#preview-new-tab-btn').click();
    await expect(page.locator('#preview-pane')).toBeVisible();

    await page.setViewportSize({ width: 1500, height: 900 });

    await expect(page.locator('.app-toast').last()).toContainText(
      '已切回 1:1 视图'
    );
    await expect(page.locator('#preview-pane')).toBeVisible();
  });
});
