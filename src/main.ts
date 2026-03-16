/**
 * Markdown 编辑器主入口
 * @version 2.8.0
 */

import { marked } from 'marked';
import { VERSION, MARKED_OPTIONS, UI_TEXT } from './config';
import {
  requireElement,
  downloadFile,
  generateTimestampFilename,
  getPlatformInfo,
  debounce,
} from './utils';
import { sanitizeHtml } from './sanitize';
import { generatePreviewHtml } from './templates/preview';
import {
  clearHistoryEntries,
  deleteHistoryEntry,
  formatDayLabel,
  formatMonthLabel,
  formatTimeLabel,
  groupHistoryEntries,
  loadHistoryEntries,
  saveHistoryEntry,
  type HistoryEntry,
} from './history';
import { showConfirm, showErrorToast } from './feedback';

function setupErrorBoundary(): void {
  window.onerror = (message, source, lineno, colno, error): boolean => {
    console.error('全局错误:', { message, source, lineno, colno, error });

    if (import.meta.env.PROD) {
      showErrorToast('应用发生错误，请刷新页面重试。如果问题持续存在，请联系技术支持。');
    }

    return false;
  };

  window.onunhandledrejection = (event: PromiseRejectionEvent): void => {
    console.error('未处理的 Promise 拒绝:', event.reason);

    if (import.meta.env.PROD) {
      showErrorToast('操作失败，请重试。');
    }
  };
}

function configureMarked(): void {
  const renderer = new marked.Renderer();

  renderer.checkbox = (checked: boolean): string => {
    const checkedAttr = checked ? ' checked' : '';
    return `<input type="checkbox"${checkedAttr}>`;
  };

  marked.setOptions({
    ...MARKED_OPTIONS,
    renderer,
  });
}

function setupKeyboardShortcuts(downloadFn: () => void): void {
  const platformInfo = getPlatformInfo();
  const debouncedDownload = debounce(downloadFn, 300);

  document.addEventListener('keydown', (event: KeyboardEvent) => {
    const isShortcutPressed = platformInfo.isMac
      ? event.metaKey && event.key === 'Enter'
      : event.ctrlKey && event.key === 'Enter';

    if (isShortcutPressed) {
      event.preventDefault();
      debouncedDownload();
    }
  });
}

function downloadMarkdown(textarea: HTMLTextAreaElement): void {
  const content = textarea.value;

  if (!content.trim()) {
    showErrorToast(UI_TEXT.ERRORS.EMPTY_CONTENT);
    return;
  }

  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const filename = generateTimestampFilename('md');

  downloadFile(blob, filename);
}

function renderMarkdownToHtml(textarea: HTMLTextAreaElement): string {
  const markdownText = textarea.value;
  const rawHtml = marked.parse(markdownText) as string;
  return sanitizeHtml(rawHtml);
}

function openPreviewInNewTab(textarea: HTMLTextAreaElement): void {
  const safeHtml = renderMarkdownToHtml(textarea);
  const previewHtml = generatePreviewHtml(safeHtml);
  const previewWindow = window.open('', '_blank');

  if (previewWindow) {
    previewWindow.document.open();
    previewWindow.document.write(previewHtml);
    previewWindow.document.close();
    previewWindow.focus();
  } else {
    showErrorToast(UI_TEXT.ERRORS.POPUP_BLOCKED);
  }
}

function writeToPreviewIframe(iframe: HTMLIFrameElement, html: string): void {
  const doc = iframe.contentDocument;
  if (!doc) return;
  doc.open();
  doc.write(html);
  doc.close();
}

function updatePreviewContent(iframe: HTMLIFrameElement, textarea: HTMLTextAreaElement): void {
  const doc = iframe.contentDocument;
  if (!doc) return;

  const contentArea = doc.getElementById('preview-content-area');
  if (!contentArea) return;

  contentArea.innerHTML = renderMarkdownToHtml(textarea);

  // Re-run enhancements (table copy buttons, color swatches)
  const win = iframe.contentWindow as Window & { wrapTablesWithCopyButton?: () => void; enhanceColorCodes?: () => void };
  if (win.wrapTablesWithCopyButton) win.wrapTablesWithCopyButton();
  if (win.enhanceColorCodes) win.enhanceColorCodes();
}

function setupScrollSync(
  textarea: HTMLTextAreaElement,
  iframe: HTMLIFrameElement,
): { enable: () => void; disable: () => void } {
  let syncing = false;

  const onEditorScroll = (): void => {
    if (syncing) return;
    syncing = true;
    const doc = iframe.contentDocument;
    const scrollEl = doc?.scrollingElement ?? doc?.documentElement;
    if (scrollEl) {
      const maxEditor = textarea.scrollHeight - textarea.clientHeight;
      const pct = maxEditor > 0 ? textarea.scrollTop / maxEditor : 0;
      const maxPreview = scrollEl.scrollHeight - scrollEl.clientHeight;
      scrollEl.scrollTop = pct * maxPreview;
    }
    requestAnimationFrame(() => { syncing = false; });
  };

  const onPreviewScroll = (): void => {
    if (syncing) return;
    syncing = true;
    const doc = iframe.contentDocument;
    const scrollEl = doc?.scrollingElement ?? doc?.documentElement;
    if (scrollEl) {
      const maxPreview = scrollEl.scrollHeight - scrollEl.clientHeight;
      const pct = maxPreview > 0 ? scrollEl.scrollTop / maxPreview : 0;
      const maxEditor = textarea.scrollHeight - textarea.clientHeight;
      textarea.scrollTop = pct * maxEditor;
    }
    requestAnimationFrame(() => { syncing = false; });
  };

  let iframeCleanup: (() => void) | null = null;

  const attachIframeListener = (): void => {
    const doc = iframe.contentDocument;
    if (!doc) return;
    doc.addEventListener('scroll', onPreviewScroll);
    iframeCleanup = () => doc.removeEventListener('scroll', onPreviewScroll);
  };

  return {
    enable: () => {
      textarea.addEventListener('scroll', onEditorScroll);
      attachIframeListener();
    },
    disable: () => {
      textarea.removeEventListener('scroll', onEditorScroll);
      if (iframeCleanup) {
        iframeCleanup();
        iframeCleanup = null;
      }
    },
  };
}

function initSplitPreview(
  textarea: HTMLTextAreaElement,
  container: HTMLElement,
  editorPane: HTMLElement,
  previewPane: HTMLElement,
  previewIframe: HTMLIFrameElement,
  previewBtn: HTMLButtonElement,
  splitActions: HTMLElement,
): { toggle: () => void; openInNewTab: () => void; clickIframeBtn: (id: string) => void } {
  let isOpen = false;
  let initialized = false;
  let scrollSync: ReturnType<typeof setupScrollSync> | null = null;

  const fullRender = (): void => {
    const safeHtml = renderMarkdownToHtml(textarea);
    const html = generatePreviewHtml(safeHtml, true);
    writeToPreviewIframe(previewIframe, html);
    initialized = true;
    // Re-attach scroll sync after full rewrite
    if (scrollSync) {
      scrollSync.disable();
      // Wait for iframe content to be ready
      setTimeout(() => scrollSync?.enable(), 100);
    }
  };

  const flashUpdate = (): void => {
    previewPane.classList.remove('updated');
    // Force reflow to restart animation
    void previewPane.offsetWidth;
    previewPane.classList.add('updated');
  };

  const incrementalUpdate = (): void => {
    if (!isOpen) return;
    if (!initialized) {
      fullRender();
      return;
    }
    updatePreviewContent(previewIframe, textarea);
    flashUpdate();
  };

  const debouncedUpdate = debounce(incrementalUpdate, 300);

  const open = (): void => {
    isOpen = true;
    container.classList.remove('single-pane');
    container.classList.add('split-pane');
    container.parentElement?.classList.add('split-active');
    editorPane.classList.remove('full-width');
    previewPane.hidden = false;
    splitActions.hidden = false;
    previewBtn.textContent = '编辑';
    fullRender();
    textarea.addEventListener('input', debouncedUpdate);
    scrollSync = setupScrollSync(textarea, previewIframe);
    setTimeout(() => scrollSync?.enable(), 150);
  };

  const close = (): void => {
    isOpen = false;
    initialized = false;
    container.classList.remove('split-pane');
    container.classList.add('single-pane');
    container.parentElement?.classList.remove('split-active');
    editorPane.classList.add('full-width');
    previewPane.hidden = true;
    splitActions.hidden = true;
    previewBtn.textContent = '预览';
    textarea.removeEventListener('input', debouncedUpdate);
    if (scrollSync) {
      scrollSync.disable();
      scrollSync = null;
    }
  };

  const toggle = (): void => {
    if (isOpen) {
      close();
    } else {
      open();
    }
  };

  const openInNewTab = (): void => {
    openPreviewInNewTab(textarea);
  };

  const clickIframeBtn = (id: string): void => {
    const btn = previewIframe.contentDocument?.getElementById(id) as HTMLButtonElement | null;
    if (btn) btn.click();
  };

  return { toggle, openInNewTab, clickIframeBtn };
}

function getHistoryPreview(content: string): string {
  const firstLine = content.trim().split('\n')[0] ?? '';
  if (firstLine.length <= 60) {
    return firstLine;
  }

  return `${firstLine.slice(0, 60)}...`;
}

function renderHistoryList(
  listElement: HTMLElement,
  entries: HistoryEntry[],
  onRestore: (entry: HistoryEntry) => Promise<void>,
): void {
  if (!entries.length) {
    listElement.innerHTML = '<p class="history-empty">暂无历史记录。</p>';
    return;
  }

  const grouped = groupHistoryEntries(entries);
  listElement.innerHTML = grouped
    .map(monthGroup => {
      const dayBlocks = monthGroup.days
        .map(dayGroup => {
          const items = dayGroup.entries
            .map(
              entry => `
              <article class="history-item" data-entry-id="${entry.id}">
                <div class="history-item-head">
                  <span>${formatTimeLabel(entry.createdAt)}</span>
                  <span>草稿</span>
                </div>
                <p class="history-item-preview">${getHistoryPreview(entry.content)}</p>
                <div class="history-item-actions">
                  <button class="history-entry-btn" data-action="restore" data-entry-id="${entry.id}" type="button">恢复</button>
                  <button class="history-entry-btn" data-action="delete" data-entry-id="${entry.id}" type="button">删除</button>
                </div>
              </article>
            `,
            )
            .join('');

          return `
            <section class="history-day">
              <h4>${formatDayLabel(dayGroup.day)}</h4>
              ${items}
            </section>
          `;
        })
        .join('');

      return `
        <section class="history-month">
          <h3>${formatMonthLabel(monthGroup.month)}</h3>
          ${dayBlocks}
        </section>
      `;
    })
    .join('');

  listElement.querySelectorAll<HTMLButtonElement>('[data-action="restore"]').forEach(button => {
    button.addEventListener('click', () => {
      const targetEntry = entries.find(entry => entry.id === button.dataset.entryId);
      if (targetEntry) {
        void onRestore(targetEntry);
      }
    });
  });

  listElement.querySelectorAll<HTMLButtonElement>('[data-action="delete"]').forEach(button => {
    button.addEventListener('click', () => {
      const targetId = button.dataset.entryId;
      if (!targetId) {
        return;
      }

      const nextEntries = deleteHistoryEntry(targetId);
      renderHistoryList(listElement, nextEntries, onRestore);
    });
  });
}

function initHistory(
  textarea: HTMLTextAreaElement,
  onRestore: (content: string) => void,
): void {
  const historyToggleBtn = requireElement<HTMLButtonElement>('history-toggle-btn');
  const historyCloseBtn = requireElement<HTMLButtonElement>('history-close-btn');
  const historyClearBtn = requireElement<HTMLButtonElement>('history-clear-btn');
  const historyOverlay = requireElement<HTMLDivElement>('history-overlay');
  const historyList = requireElement<HTMLDivElement>('history-list');

  const openHistory = (): void => {
    historyOverlay.hidden = false;
    document.body.classList.add('modal-open');
    historyCloseBtn.focus();
    renderHistoryList(historyList, loadHistoryEntries(), entry => {
      return showConfirm({
        title: '恢复草稿',
        message: '恢复该草稿将覆盖当前编辑内容，是否继续？',
        confirmText: '恢复',
      }).then(shouldRestore => {
        if (!shouldRestore) {
          return;
        }

        onRestore(entry.content);
        closeHistory();
      });
    });
  };

  const closeHistory = (): void => {
    historyOverlay.hidden = true;
    document.body.classList.remove('modal-open');
    historyToggleBtn.focus();
  };

  historyToggleBtn.addEventListener('click', openHistory);
  historyCloseBtn.addEventListener('click', closeHistory);

  historyOverlay.addEventListener('click', event => {
    if (event.target === historyOverlay) {
      closeHistory();
    }
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !historyOverlay.hidden) {
      closeHistory();
    }
  });

  historyClearBtn.addEventListener('click', async () => {
    const shouldClear = await showConfirm({
      title: '清空历史记录',
      message: '确定清空全部历史记录吗？',
      confirmText: '清空',
    });
    if (!shouldClear) {
      return;
    }

    clearHistoryEntries();
    renderHistoryList(historyList, [], async () => undefined);
  });

  const persistDraft = debounce(() => {
    saveHistoryEntry(textarea.value);
  }, 2000);

  textarea.addEventListener('input', () => {
    persistDraft();
  });

  window.addEventListener('beforeunload', () => {
    saveHistoryEntry(textarea.value);
  });
}

function initApp(): void {
  setupErrorBoundary();
  configureMarked();

  const markdownInput = requireElement<HTMLTextAreaElement>('markdown-input');
  const previewBtn = requireElement<HTMLButtonElement>('preview-new-tab-btn');
  const downloadBtn = requireElement<HTMLButtonElement>('download-markdown-btn');
  const editorContainer = requireElement<HTMLDivElement>('editor-container');
  const editorPane = requireElement<HTMLDivElement>('editor-pane');
  const previewPane = requireElement<HTMLDivElement>('preview-pane');
  const previewIframe = requireElement<HTMLIFrameElement>('preview-iframe');
  const previewCloseBtn = requireElement<HTMLButtonElement>('preview-close-btn');
  const splitActions = requireElement<HTMLDivElement>('split-actions');

  // Action bar buttons
  const actionPagedPdf = requireElement<HTMLButtonElement>('action-paged-pdf');
  const actionSinglePdf = requireElement<HTMLButtonElement>('action-single-pdf');
  const actionCopy = requireElement<HTMLButtonElement>('action-copy');
  const actionLongImage = requireElement<HTMLButtonElement>('action-long-image');
  const actionNewTab = requireElement<HTMLButtonElement>('action-new-tab');

  markdownInput.value = '';

  const splitPreview = initSplitPreview(
    markdownInput,
    editorContainer,
    editorPane,
    previewPane,
    previewIframe,
    previewBtn,
    splitActions,
  );

  downloadBtn.addEventListener('click', () => {
    downloadMarkdown(markdownInput);
  });

  previewBtn.addEventListener('click', () => {
    splitPreview.toggle();
  });

  previewCloseBtn.addEventListener('click', () => {
    splitPreview.toggle();
  });

  // Action bar: delegate to iframe buttons
  actionPagedPdf.addEventListener('click', () => {
    splitPreview.clickIframeBtn('download-pdf-btn');
  });
  actionSinglePdf.addEventListener('click', () => {
    splitPreview.clickIframeBtn('download-single-page-pdf-btn');
  });
  actionCopy.addEventListener('click', () => {
    splitPreview.clickIframeBtn('copy-preview-btn');
  });
  actionLongImage.addEventListener('click', () => {
    splitPreview.clickIframeBtn('export-long-image-btn');
  });
  actionNewTab.addEventListener('click', () => {
    splitPreview.openInNewTab();
  });

  setupKeyboardShortcuts(() => {
    downloadMarkdown(markdownInput);
  });

  initHistory(markdownInput, content => {
    markdownInput.value = content;
  });

  if (import.meta.env.DEV) {
    console.log(`Markdown 编辑器 v${VERSION} 已初始化`);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
