/**
 * Markdown 编辑器主入口
 * @version 2.0.0
 */

import { marked } from 'marked';
import { VERSION, EXAMPLE_MARKDOWN, MARKED_OPTIONS, UI_TEXT } from './config';
import {
  requireElement,
  downloadFile,
  generateTimestampFilename,
  getPlatformInfo,
  debounce,
} from './utils';
import { sanitizeHtml } from './sanitize';
import { generatePreviewHtml } from './templates/preview';

// =============================================================================
// 全局错误边界
// =============================================================================

/**
 * 设置全局错误处理
 */
function setupErrorBoundary(): void {
  // 捕获未处理的错误
  window.onerror = (message, source, lineno, colno, error): boolean => {
    console.error('全局错误:', { message, source, lineno, colno, error });

    // 只在生产环境显示友好提示，开发环境保持默认行为
    if (import.meta.env.PROD) {
      alert('应用发生错误，请刷新页面重试。如果问题持续存在，请联系技术支持。');
    }

    // 返回 true 阻止默认错误处理
    return false;
  };

  // 捕获未处理的 Promise 拒绝
  window.onunhandledrejection = (event: PromiseRejectionEvent): void => {
    console.error('未处理的 Promise 拒绝:', event.reason);

    if (import.meta.env.PROD) {
      alert('操作失败，请重试。');
    }
  };
}

// =============================================================================
// Marked.js 配置
// =============================================================================

/**
 * 配置 Marked.js
 */
function configureMarked(): void {
  marked.setOptions({
    ...MARKED_OPTIONS,
  });
}

// =============================================================================
// 快捷键处理
// =============================================================================

/**
 * 设置快捷键监听
 * @param downloadFn 下载函数
 */
function setupKeyboardShortcuts(downloadFn: () => void): void {
  const platformInfo = getPlatformInfo();

  // 使用防抖避免快速连续触发
  const debouncedDownload = debounce(downloadFn, 300);

  document.addEventListener('keydown', (event: KeyboardEvent) => {
    // Mac: Cmd+Enter, Windows/Linux: Ctrl+Enter
    const isShortcutPressed = platformInfo.isMac
      ? event.metaKey && event.key === 'Enter'
      : event.ctrlKey && event.key === 'Enter';

    if (isShortcutPressed) {
      event.preventDefault();
      debouncedDownload();
    }
  });
}

// =============================================================================
// 下载功能
// =============================================================================

/**
 * 下载 Markdown 文件
 * @param textarea 编辑器 textarea 元素
 */
function downloadMarkdown(textarea: HTMLTextAreaElement): void {
  const content = textarea.value;

  if (!content.trim()) {
    alert(UI_TEXT.ERRORS.EMPTY_CONTENT);
    return;
  }

  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const filename = generateTimestampFilename('md');

  downloadFile(blob, filename);
}

// =============================================================================
// 预览功能
// =============================================================================

/**
 * 在新标签页打开预览
 * @param textarea 编辑器 textarea 元素
 */
function openPreviewInNewTab(textarea: HTMLTextAreaElement): void {
  const markdownText = textarea.value;

  // 使用 marked 转换 Markdown 为 HTML
  const rawHtml = marked.parse(markdownText) as string;

  // 使用 DOMPurify 消毒 HTML（防止 XSS，但保留安全样式）
  const safeHtml = sanitizeHtml(rawHtml);

  // 生成完整的预览页面 HTML
  const previewHtml = generatePreviewHtml(safeHtml);

  // 在新标签页打开
  const previewWindow = window.open('', '_blank');

  if (previewWindow) {
    previewWindow.document.open();
    previewWindow.document.write(previewHtml);
    previewWindow.document.close();
    previewWindow.focus();
  } else {
    alert(UI_TEXT.ERRORS.POPUP_BLOCKED);
  }
}

// =============================================================================
// 应用初始化
// =============================================================================

/**
 * 初始化应用
 */
function initApp(): void {
  // 设置错误边界
  setupErrorBoundary();

  // 配置 Marked.js
  configureMarked();

  // 获取 DOM 元素
  const markdownInput = requireElement<HTMLTextAreaElement>('markdown-input');
  const previewBtn = requireElement<HTMLButtonElement>('preview-new-tab-btn');
  const downloadBtn = requireElement<HTMLButtonElement>('download-markdown-btn');

  // 设置初始内容
  markdownInput.value = EXAMPLE_MARKDOWN;

  // 绑定下载按钮事件
  downloadBtn.addEventListener('click', () => {
    downloadMarkdown(markdownInput);
  });

  // 绑定预览按钮事件
  previewBtn.addEventListener('click', () => {
    openPreviewInNewTab(markdownInput);
  });

  // 设置快捷键
  setupKeyboardShortcuts(() => {
    downloadMarkdown(markdownInput);
  });

  // 在开发环境输出版本信息
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log(`Markdown 编辑器 v${VERSION} 已初始化`);
  }
}

// =============================================================================
// 启动应用
// =============================================================================

// DOM 加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
