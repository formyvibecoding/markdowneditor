/**
 * Markdown 编辑器主入口
 * @version 2.4.3
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

function openPreviewInNewTab(textarea: HTMLTextAreaElement): void {
  const markdownText = textarea.value;
  const rawHtml = marked.parse(markdownText) as string;
  const safeHtml = sanitizeHtml(rawHtml);
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

  markdownInput.value = '';

  downloadBtn.addEventListener('click', () => {
    downloadMarkdown(markdownInput);
  });

  previewBtn.addEventListener('click', () => {
    openPreviewInNewTab(markdownInput);
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
