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
  });

  test('应该在编辑器中显示示例内容', async ({ page }) => {
    const textarea = page.locator('#markdown-input');
    const content = await textarea.inputValue();
    expect(content).toContain('# 一级标题');
    expect(content).toContain('## 二级标题');
  });

  test('应该允许用户编辑内容', async ({ page }) => {
    const textarea = page.locator('#markdown-input');

    // 清空并输入新内容
    await textarea.fill('# 测试标题\n\n这是测试内容');

    const content = await textarea.inputValue();
    expect(content).toBe('# 测试标题\n\n这是测试内容');
  });

  test('应该在新标签页打开预览', async ({ page, context }) => {
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
    const pagePromise = context.waitForEvent('page');
    await page.locator('#preview-new-tab-btn').click();
    const newPage = await pagePromise;
    await newPage.waitForLoadState();

    // 验证两个 PDF 按钮存在
    await expect(newPage.locator('#download-pdf-btn')).toBeVisible();
    await expect(newPage.locator('#download-single-page-pdf-btn')).toBeVisible();

    // 验证按钮文案统一
    await expect(newPage.locator('#download-pdf-btn')).toHaveText('下载 PDF（分页）');
    await expect(newPage.locator('#download-single-page-pdf-btn')).toHaveText('下载 PDF（单页）');
  });

  test('空内容时下载应该显示警告', async ({ page }) => {
    const textarea = page.locator('#markdown-input');

    // 清空内容
    await textarea.fill('');
    await textarea.fill('   '); // 只有空格

    // 监听 alert 对话框
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('编辑器内容为空');
      await dialog.accept();
    });

    // 点击下载按钮
    await page.locator('#download-markdown-btn').click();
  });
});
