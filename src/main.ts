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
import { showConfirm, showErrorToast, showToast } from './feedback';

const SPLIT_PREVIEW_MIN_VIEWPORT = 1280;
const PREVIEW_FOCUS_MIN_VIEWPORT = 1680;
const MOTION_LAYOUT_DURATION = 420;
const MOTION_ENTER_DURATION = 320;
const MOTION_EXIT_DURATION = 220;
const MOTION_LAYOUT_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';
const MOTION_EXIT_EASING = 'cubic-bezier(0.25, 1, 0.5, 1)';

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

function canUseSplitPreview(): boolean {
  return window.innerWidth >= SPLIT_PREVIEW_MIN_VIEWPORT;
}

function canUsePreviewFocusLayout(): boolean {
  return window.innerWidth >= PREVIEW_FOCUS_MIN_VIEWPORT;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function waitForNextFrame(): Promise<void> {
  return new Promise(resolve => {
    requestAnimationFrame(() => resolve());
  });
}

function isRenderableElement(element: HTMLElement): boolean {
  return element.isConnected && !element.hidden && element.getClientRects().length > 0;
}

function snapshotRects(elements: Array<HTMLElement | null | undefined>): Map<HTMLElement, DOMRect> {
  const rects = new Map<HTMLElement, DOMRect>();

  elements.forEach(element => {
    if (!element || !isRenderableElement(element)) {
      return;
    }
    rects.set(element, element.getBoundingClientRect());
  });

  return rects;
}

function cancelAnimations(elements: Array<HTMLElement | null | undefined>): void {
  elements.forEach(element => {
    element?.getAnimations().forEach(animation => animation.cancel());
  });
}

function animateFromRect(
  element: HTMLElement,
  firstRect: DOMRect,
  options: { duration?: number; delay?: number; opacity?: [number, number] } = {},
): Animation | null {
  if (!isRenderableElement(element)) {
    return null;
  }

  const {
    duration = MOTION_LAYOUT_DURATION,
    delay = 0,
    opacity = [1, 1],
  } = options;

  const lastRect = element.getBoundingClientRect();
  const deltaX = firstRect.left - lastRect.left;
  const deltaY = firstRect.top - lastRect.top;
  const scaleX = firstRect.width > 0 ? firstRect.width / Math.max(lastRect.width, 1) : 1;
  const scaleY = firstRect.height > 0 ? firstRect.height / Math.max(lastRect.height, 1) : 1;

  if (
    Math.abs(deltaX) < 1
    && Math.abs(deltaY) < 1
    && Math.abs(scaleX - 1) < 0.01
    && Math.abs(scaleY - 1) < 0.01
    && opacity[0] === opacity[1]
  ) {
    return null;
  }

  return element.animate(
    [
      {
        transformOrigin: 'top left',
        transform: `translate(${deltaX}px, ${deltaY}px) scale(${scaleX}, ${scaleY})`,
        opacity: opacity[0],
      },
      {
        transformOrigin: 'top left',
        transform: 'translate(0, 0) scale(1, 1)',
        opacity: opacity[1],
      },
    ],
    {
      duration,
      delay,
      easing: MOTION_LAYOUT_EASING,
      fill: 'both',
    },
  );
}

function animateEntrance(
  element: HTMLElement,
  options: { fromX?: number; fromY?: number; fromScale?: number; delay?: number; duration?: number } = {},
): Animation | null {
  if (!isRenderableElement(element)) {
    return null;
  }

  const {
    fromX = 0,
    fromY = 0,
    fromScale = 0.98,
    delay = 0,
    duration = MOTION_ENTER_DURATION,
  } = options;

  return element.animate(
    [
      {
        transform: `translate(${fromX}px, ${fromY}px) scale(${fromScale})`,
        opacity: 0,
      },
      {
        transform: 'translate(0, 0) scale(1)',
        opacity: 1,
      },
    ],
    {
      duration,
      delay,
      easing: MOTION_LAYOUT_EASING,
      fill: 'both',
    },
  );
}

function animateExit(
  element: HTMLElement,
  options: { toX?: number; toY?: number; toScale?: number; duration?: number } = {},
): Promise<void> {
  if (!isRenderableElement(element)) {
    return Promise.resolve();
  }

  const {
    toX = 0,
    toY = 0,
    toScale = 0.98,
    duration = MOTION_EXIT_DURATION,
  } = options;

  const animation = element.animate(
    [
      {
        transform: 'translate(0, 0) scale(1)',
        opacity: 1,
      },
      {
        transform: `translate(${toX}px, ${toY}px) scale(${toScale})`,
        opacity: 0,
      },
    ],
    {
      duration,
      easing: MOTION_EXIT_EASING,
      fill: 'both',
    },
  );

  return animation.finished.then(() => undefined).catch(() => undefined);
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

function openPreviewInNewTab(textarea: HTMLTextAreaElement): boolean {
  const safeHtml = renderMarkdownToHtml(textarea);
  const previewHtml = generatePreviewHtml(safeHtml);
  const previewWindow = window.open('', '_blank');

  if (previewWindow) {
    previewWindow.document.open();
    previewWindow.document.write(previewHtml);
    previewWindow.document.close();
    previewWindow.focus();
    return true;
  }

  showErrorToast(UI_TEXT.ERRORS.POPUP_BLOCKED);
  return false;
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

  // Re-run enhancements (copy buttons, color swatches)
  const win = iframe.contentWindow as Window & {
    wrapTablesWithCopyButton?: () => void;
    wrapCodeBlocksWithCopyButton?: () => void;
    enhanceColorCodes?: () => void;
  };
  if (win.wrapTablesWithCopyButton) win.wrapTablesWithCopyButton();
  if (win.wrapCodeBlocksWithCopyButton) win.wrapCodeBlocksWithCopyButton();
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

type SplitLayoutMode = 'balanced' | 'preview-focus';

function initSplitPreview(
  textarea: HTMLTextAreaElement,
  container: HTMLElement,
  editorPane: HTMLElement,
  previewPane: HTMLElement,
  previewIframe: HTMLIFrameElement,
  previewBtn: HTMLButtonElement,
  splitActions: HTMLElement,
): {
  toggle: () => void;
  openInNewTab: () => boolean;
  clickIframeBtn: (id: string) => void;
  setLayoutMode: (mode: SplitLayoutMode) => void;
  setSystemLayoutMode: (mode: SplitLayoutMode) => void;
  getLayoutMode: () => SplitLayoutMode;
  close: () => void;
  isOpen: () => boolean;
} {
  let isOpen = false;
  let initialized = false;
  let isTransitioning = false;
  let scrollSync: ReturnType<typeof setupScrollSync> | null = null;
  let resizeCleanup: (() => void) | null = null;
  let layoutMode: SplitLayoutMode = canUsePreviewFocusLayout() ? 'preview-focus' : 'balanced';
  let balancedEditorWidth = 700;
  let hasExplicitLayoutPreference = false;

  const parentContainer = container.parentElement;
  const controlPanel = parentContainer?.querySelector<HTMLElement>('.control-panel') ?? null;

  const applyLayoutMetrics = (): void => {
    const shellWidth = Math.round(
      layoutMode === 'preview-focus'
        ? balancedEditorWidth * 3
        : balancedEditorWidth * 2,
    );

    container.dataset.splitLayout = layoutMode;
    parentContainer?.style.setProperty('--split-shell-width', `${shellWidth}px`);
    parentContainer?.setAttribute('data-split-layout', layoutMode);
  };

  const captureBalancedWidth = (): void => {
    const nextWidth = Math.round(editorPane.getBoundingClientRect().width);
    if (nextWidth > 0) {
      balancedEditorWidth = nextWidth;
    }
  };

  const refreshLayoutMetrics = (measureBalanced = false): void => {
    requestAnimationFrame(() => {
      if (!isOpen) return;
      if (measureBalanced && layoutMode === 'balanced') {
        captureBalancedWidth();
      }
      applyLayoutMetrics();
    });
  };

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

  const getAnimatedShellElements = (): HTMLElement[] => {
    return [container, editorPane, previewPane, splitActions, controlPanel].filter(
      (element): element is HTMLElement => Boolean(element),
    );
  };

  const getSplitActionItems = (): HTMLElement[] => {
    return Array.from(splitActions.children).filter(
      (child): child is HTMLElement => child instanceof HTMLElement,
    );
  };

  const open = (): void => {
    if (isTransitioning) return;
    if (!hasExplicitLayoutPreference) {
      layoutMode = canUsePreviewFocusLayout() ? 'preview-focus' : 'balanced';
    }
    captureBalancedWidth();
    const beforeRects = snapshotRects([container, editorPane, controlPanel]);

    isOpen = true;
    container.classList.remove('single-pane');
    container.classList.add('split-pane');
    parentContainer?.classList.add('split-active');
    editorPane.classList.remove('full-width');
    previewPane.hidden = false;
    splitActions.hidden = false;
    previewBtn.textContent = '编辑';
    fullRender();
    applyLayoutMetrics();
    textarea.addEventListener('input', debouncedUpdate);
    scrollSync = setupScrollSync(textarea, previewIframe);
    setTimeout(() => scrollSync?.enable(), 150);
    const onResize = (): void => {
      if (isOpen) {
        refreshLayoutMetrics(layoutMode === 'balanced');
      }
    };
    window.addEventListener('resize', onResize);
    resizeCleanup = () => window.removeEventListener('resize', onResize);

    if (prefersReducedMotion()) {
      refreshLayoutMetrics(true);
      return;
    }

    isTransitioning = true;
    void (async () => {
      await waitForNextFrame();
      cancelAnimations(getAnimatedShellElements());

      const animations = [
        animateFromRect(container, beforeRects.get(container) ?? container.getBoundingClientRect()),
        animateFromRect(editorPane, beforeRects.get(editorPane) ?? editorPane.getBoundingClientRect()),
      ];

      if (controlPanel && beforeRects.has(controlPanel)) {
        animations.push(animateFromRect(controlPanel, beforeRects.get(controlPanel)!));
      }

      animations.push(animateEntrance(previewPane, { fromX: 42, fromScale: 0.985, duration: 360 }));
      animations.push(animateEntrance(splitActions, { fromY: 18, duration: 280 }));
      getSplitActionItems().forEach((item, index) => {
        animations.push(animateEntrance(item, { fromY: 12, duration: 260, delay: 60 + (index * 28) }));
      });

      await Promise.all(animations.filter(Boolean).map(animation => animation!.finished.catch(() => undefined)));
      isTransitioning = false;
    })();
  };

  const applyClosedState = (): void => {
    isOpen = false;
    initialized = false;
    container.classList.remove('split-pane');
    container.classList.add('single-pane');
    parentContainer?.classList.remove('split-active');
    editorPane.classList.add('full-width');
    previewPane.hidden = true;
    splitActions.hidden = true;
    previewBtn.textContent = '预览';
    textarea.removeEventListener('input', debouncedUpdate);
    if (scrollSync) {
      scrollSync.disable();
      scrollSync = null;
    }
    if (resizeCleanup) {
      resizeCleanup();
      resizeCleanup = null;
    }
  };

  const close = (): void => {
    if (isTransitioning) return;
    if (prefersReducedMotion()) {
      applyClosedState();
      return;
    }

    isTransitioning = true;
    const beforeRects = snapshotRects([container, editorPane, controlPanel]);
    const exitingElements = [previewPane, splitActions, ...getSplitActionItems()];
    cancelAnimations(exitingElements);

    void (async () => {
      await Promise.all([
        animateExit(previewPane, { toX: 28, toScale: 0.985 }),
        animateExit(splitActions, { toY: 14, toScale: 0.99 }),
      ]);

      applyClosedState();

      await waitForNextFrame();
      cancelAnimations([container, editorPane, controlPanel]);

      const animations = [
        animateFromRect(container, beforeRects.get(container) ?? container.getBoundingClientRect()),
        animateFromRect(editorPane, beforeRects.get(editorPane) ?? editorPane.getBoundingClientRect()),
      ];

      if (controlPanel && beforeRects.has(controlPanel)) {
        animations.push(animateFromRect(controlPanel, beforeRects.get(controlPanel)!));
      }

      await Promise.all(animations.filter(Boolean).map(animation => animation!.finished.catch(() => undefined)));
      isTransitioning = false;
    })();
  };

  const setLayoutMode = (mode: SplitLayoutMode, userInitiated = true): void => {
    if (layoutMode === mode) return;
    if (isTransitioning) return;

    const beforeRects = snapshotRects([container, editorPane, previewPane, splitActions, controlPanel]);

    layoutMode = mode;
    if (userInitiated) {
      hasExplicitLayoutPreference = true;
    }

    if (!isOpen) {
      return;
    }

    applyLayoutMetrics();

    if (prefersReducedMotion()) {
      refreshLayoutMetrics(mode === 'balanced');
      return;
    }

    isTransitioning = true;
    void (async () => {
      await waitForNextFrame();
      cancelAnimations(getAnimatedShellElements());

      const animations = [
        animateFromRect(container, beforeRects.get(container) ?? container.getBoundingClientRect()),
        animateFromRect(editorPane, beforeRects.get(editorPane) ?? editorPane.getBoundingClientRect()),
        animateFromRect(previewPane, beforeRects.get(previewPane) ?? previewPane.getBoundingClientRect()),
        animateFromRect(splitActions, beforeRects.get(splitActions) ?? splitActions.getBoundingClientRect(), {
          opacity: [0.88, 1],
          duration: 300,
        }),
      ];

      if (controlPanel && beforeRects.has(controlPanel)) {
        animations.push(animateFromRect(controlPanel, beforeRects.get(controlPanel)!));
      }

      await Promise.all(animations.filter(Boolean).map(animation => animation!.finished.catch(() => undefined)));
      isTransitioning = false;
    })();
  };

  const toggle = (): void => {
    if (isOpen) {
      close();
    } else {
      open();
    }
  };

  const openInNewTab = (): boolean => {
    return openPreviewInNewTab(textarea);
  };

  const clickIframeBtn = (id: string): void => {
    const btn = previewIframe.contentDocument?.getElementById(id) as HTMLButtonElement | null;
    if (btn) btn.click();
  };

  return {
    toggle,
    openInNewTab,
    clickIframeBtn,
    setLayoutMode: (mode: SplitLayoutMode) => setLayoutMode(mode, true),
    setSystemLayoutMode: (mode: SplitLayoutMode) => setLayoutMode(mode, false),
    getLayoutMode: () => layoutMode,
    close,
    isOpen: () => isOpen,
  };
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
  const splitActions = requireElement<HTMLDivElement>('split-actions');

  // Action bar buttons
  const actionPagedPdf = requireElement<HTMLButtonElement>('action-paged-pdf');
  const actionSinglePdf = requireElement<HTMLButtonElement>('action-single-pdf');
  const actionCopy = requireElement<HTMLButtonElement>('action-copy');
  const actionLongImage = requireElement<HTMLButtonElement>('action-long-image');
  const actionNewTab = requireElement<HTMLButtonElement>('action-new-tab');
  const splitViewBalancedBtn = requireElement<HTMLButtonElement>('split-view-balanced');
  const splitViewPreviewFocusBtn = requireElement<HTMLButtonElement>('split-view-preview-focus');

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

  const setSplitViewButtonState = (mode: SplitLayoutMode): void => {
    splitViewBalancedBtn.classList.toggle('is-active', mode === 'balanced');
    splitViewBalancedBtn.setAttribute('aria-pressed', String(mode === 'balanced'));
    splitViewPreviewFocusBtn.classList.toggle('is-active', mode === 'preview-focus');
    splitViewPreviewFocusBtn.setAttribute('aria-pressed', String(mode === 'preview-focus'));
  };

  let lastCanUseSplitPreview = canUseSplitPreview();
  let lastCanUsePreviewFocus = canUsePreviewFocusLayout();

  const syncSplitPreviewAvailability = (announce = false): void => {
    const splitAllowed = canUseSplitPreview();
    const previewFocusAllowed = canUsePreviewFocusLayout();

    previewBtn.title = splitAllowed
      ? '打开分屏预览'
      : `当前窗口较窄，将使用新窗口预览（至少 ${SPLIT_PREVIEW_MIN_VIEWPORT}px）`;

    splitViewPreviewFocusBtn.disabled = !previewFocusAllowed;
    splitViewPreviewFocusBtn.title = previewFocusAllowed
      ? '保持编辑区不变，扩张预览区到两倍宽'
      : `当前窗口宽度不足，至少 ${PREVIEW_FOCUS_MIN_VIEWPORT}px 可使用 1:2 视图`;

    if (!splitAllowed && splitPreview.isOpen()) {
      splitPreview.close();
      setSplitViewButtonState('balanced');
      if (announce && lastCanUseSplitPreview) {
        showToast(`窗口宽度不足，已退出分屏预览。分屏至少需要 ${SPLIT_PREVIEW_MIN_VIEWPORT}px，请使用新窗口预览。`);
      }
    } else if (!previewFocusAllowed && splitPreview.getLayoutMode() === 'preview-focus') {
      splitPreview.setSystemLayoutMode('balanced');
      setSplitViewButtonState('balanced');
      if (announce && lastCanUsePreviewFocus) {
        showToast(`窗口宽度不足，已切回 1:1 视图。1:2 视图至少需要 ${PREVIEW_FOCUS_MIN_VIEWPORT}px。`);
      }
    }

    lastCanUseSplitPreview = splitAllowed;
    lastCanUsePreviewFocus = previewFocusAllowed;
  };

  setSplitViewButtonState(splitPreview.getLayoutMode());
  syncSplitPreviewAvailability();

  downloadBtn.addEventListener('click', () => {
    downloadMarkdown(markdownInput);
  });

  previewBtn.addEventListener('click', () => {
    if (splitPreview.isOpen()) {
      splitPreview.toggle();
      return;
    }

    if (!canUseSplitPreview()) {
      const opened = splitPreview.openInNewTab();
      if (opened) {
        showToast(`当前窗口宽度不足，已改为新窗口预览。分屏至少需要 ${SPLIT_PREVIEW_MIN_VIEWPORT}px。`);
      }
      return;
    }

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

  splitViewBalancedBtn.addEventListener('click', () => {
    splitPreview.setLayoutMode('balanced');
    setSplitViewButtonState('balanced');
  });

  splitViewPreviewFocusBtn.addEventListener('click', () => {
    if (!canUsePreviewFocusLayout()) {
      showToast(`当前窗口宽度不足，1:2 视图至少需要 ${PREVIEW_FOCUS_MIN_VIEWPORT}px。`);
      return;
    }
    splitPreview.setLayoutMode('preview-focus');
    setSplitViewButtonState('preview-focus');
  });

  window.addEventListener('resize', debounce(() => {
    syncSplitPreviewAvailability(true);
  }, 120));

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
