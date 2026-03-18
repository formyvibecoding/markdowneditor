/**
 * Markdown 编辑器主入口
 * @version 2.9.0
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
import { renderButtonContent, setButtonContent } from './ui-icons';

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
      showErrorToast(
        '应用发生错误，请刷新页面重试。如果问题持续存在，请联系技术支持。'
      );
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

function setupKeyboardShortcuts(
  downloadFn: () => void,
  previewFn: () => void
): void {
  const platformInfo = getPlatformInfo();
  const debouncedDownload = debounce(downloadFn, 300);

  document.addEventListener('keydown', (event: KeyboardEvent) => {
    const mod = platformInfo.isMac ? event.metaKey : event.ctrlKey;

    if (mod && event.key === 'Enter') {
      event.preventDefault();
      debouncedDownload();
      return;
    }

    if (mod && event.key === 'p') {
      event.preventDefault();
      previewFn();
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
  return (
    element.isConnected &&
    !element.hidden &&
    element.getClientRects().length > 0
  );
}

function snapshotRects(
  elements: Array<HTMLElement | null | undefined>
): Map<HTMLElement, DOMRect> {
  const rects = new Map<HTMLElement, DOMRect>();

  elements.forEach(element => {
    if (!element || !isRenderableElement(element)) {
      return;
    }
    rects.set(element, element.getBoundingClientRect());
  });

  return rects;
}

function cancelAnimations(
  elements: Array<HTMLElement | null | undefined>
): void {
  elements.forEach(element => {
    element?.getAnimations().forEach(animation => animation.cancel());
  });
}

function animateFromRect(
  element: HTMLElement,
  firstRect: DOMRect,
  options: {
    duration?: number;
    delay?: number;
    opacity?: [number, number];
  } = {}
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
  const scaleX =
    firstRect.width > 0 ? firstRect.width / Math.max(lastRect.width, 1) : 1;
  const scaleY =
    firstRect.height > 0 ? firstRect.height / Math.max(lastRect.height, 1) : 1;

  if (
    Math.abs(deltaX) < 1 &&
    Math.abs(deltaY) < 1 &&
    Math.abs(scaleX - 1) < 0.01 &&
    Math.abs(scaleY - 1) < 0.01 &&
    opacity[0] === opacity[1]
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
    }
  );
}

function animateEntrance(
  element: HTMLElement,
  options: {
    fromX?: number;
    fromY?: number;
    fromScale?: number;
    delay?: number;
    duration?: number;
  } = {}
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
    }
  );
}

function animateExit(
  element: HTMLElement,
  options: {
    toX?: number;
    toY?: number;
    toScale?: number;
    duration?: number;
  } = {}
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
    }
  );

  return animation.finished.then(() => undefined).catch(() => undefined);
}

function buildPreviewClipboardPayload(container: HTMLElement): {
  html: string;
  text: string;
} {
  const clone = container.cloneNode(true) as HTMLElement;
  const liveInputs = container.querySelectorAll<HTMLInputElement>(
    'input[type="checkbox"]'
  );
  const cloneInputs = clone.querySelectorAll<HTMLInputElement>(
    'input[type="checkbox"]'
  );

  liveInputs.forEach((input, index) => {
    const cloneInput = cloneInputs[index];
    if (!cloneInput) return;

    if (input.checked) {
      cloneInput.setAttribute('checked', '');
    } else {
      cloneInput.removeAttribute('checked');
    }
  });

  clone
    .querySelectorAll('.table-copy-btn, .code-copy-btn, .color-swatch-btn')
    .forEach(element => element.remove());

  return {
    html: clone.innerHTML,
    text: clone.innerText,
  };
}

async function writeRichClipboardData(
  html: string,
  text: string
): Promise<boolean> {
  try {
    if (navigator.clipboard && window.ClipboardItem) {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([text], { type: 'text/plain' }),
        }),
      ]);
      return true;
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (error) {
    // Fall through to execCommand fallback.
  }

  const selection = window.getSelection();
  if (!selection) {
    return false;
  }

  try {
    let handled = false;
    const onCopy = (event: ClipboardEvent): void => {
      if (!event.clipboardData) {
        return;
      }
      event.clipboardData.setData('text/html', html);
      event.clipboardData.setData('text/plain', text);
      event.preventDefault();
      handled = true;
    };

    document.addEventListener('copy', onCopy, { once: true });
    const copied = document.execCommand('copy');
    return copied && handled;
  } catch (error) {
    // Fall through to selection-based fallback.
  }

  const previousRanges: Range[] = [];
  for (let i = 0; i < selection.rangeCount; i += 1) {
    previousRanges.push(selection.getRangeAt(i));
  }

  const fallbackNode = document.createElement('div');
  fallbackNode.contentEditable = 'true';
  fallbackNode.setAttribute('aria-hidden', 'true');
  fallbackNode.style.position = 'fixed';
  fallbackNode.style.top = '0';
  fallbackNode.style.left = '-9999px';
  fallbackNode.style.opacity = '0';
  fallbackNode.innerHTML = html;
  document.body.appendChild(fallbackNode);

  try {
    const range = document.createRange();
    range.selectNodeContents(fallbackNode);
    selection.removeAllRanges();
    selection.addRange(range);
    return document.execCommand('copy');
  } catch (error) {
    return false;
  } finally {
    selection.removeAllRanges();
    previousRanges.forEach(range => selection.addRange(range));
    fallbackNode.remove();
  }
}

async function copySplitPreviewContent(
  iframe: HTMLIFrameElement
): Promise<boolean> {
  const contentArea = iframe.contentDocument?.getElementById(
    'preview-content-area'
  );
  if (!(contentArea instanceof HTMLElement)) {
    return false;
  }

  const { html, text } = buildPreviewClipboardPayload(contentArea);
  return writeRichClipboardData(html, text);
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

function openPreviewInNewTab(
  textarea: HTMLTextAreaElement,
  imageWidthState: Record<string, string> = {}
): boolean {
  const safeHtml = renderMarkdownToHtml(textarea);
  const previewHtml = generatePreviewHtml(safeHtml, false, imageWidthState);
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

function updatePreviewContent(
  iframe: HTMLIFrameElement,
  textarea: HTMLTextAreaElement
): void {
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
    setupCheckboxSync?: () => void;
    setupImageWidthControls?: () => void;
    applySavedImageWidths?: () => void;
  };
  if (win.wrapTablesWithCopyButton) win.wrapTablesWithCopyButton();
  if (win.wrapCodeBlocksWithCopyButton) win.wrapCodeBlocksWithCopyButton();
  if (win.enhanceColorCodes) win.enhanceColorCodes();
  if (win.setupCheckboxSync) win.setupCheckboxSync();
  if (win.setupImageWidthControls) win.setupImageWidthControls();
  if (win.applySavedImageWidths) win.applySavedImageWidths();
}

function getHeadingLinePositions(textarea: HTMLTextAreaElement): number[] {
  const text = textarea.value;
  const lines = text.split('\n');
  const positions: number[] = [];
  // Approximate line height from textarea
  const lineHeight = textarea.scrollHeight / Math.max(lines.length, 1);
  let lineIndex = 0;
  for (let i = 0; i < lines.length; i++) {
    if (/^#{1,6}\s/.test(lines[i] ?? '')) {
      positions.push(lineIndex * lineHeight);
    }
    lineIndex++;
  }
  return positions;
}

function setupScrollSync(
  textarea: HTMLTextAreaElement,
  iframe: HTMLIFrameElement
): { enable: () => void; disable: () => void } {
  let syncing = false;

  const getPreviewHeadingPositions = (): number[] => {
    const doc = iframe.contentDocument;
    if (!doc) return [];
    const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
    return Array.from(headings).map(h => (h as HTMLElement).offsetTop);
  };

  const onEditorScroll = (): void => {
    if (syncing) return;
    syncing = true;
    const doc = iframe.contentDocument;
    const scrollEl = doc?.scrollingElement ?? doc?.documentElement;
    if (scrollEl) {
      const editorPositions = getHeadingLinePositions(textarea);
      const previewPositions = getPreviewHeadingPositions();

      if (editorPositions.length > 0 && editorPositions.length === previewPositions.length) {
        const scrollTop = textarea.scrollTop;
        let anchorIdx = 0;
        for (let i = editorPositions.length - 1; i >= 0; i--) {
          if (editorPositions[i]! <= scrollTop + 10) {
            anchorIdx = i;
            break;
          }
        }
        const nextIdx = Math.min(anchorIdx + 1, editorPositions.length - 1);
        const editorStart = editorPositions[anchorIdx]!;
        const editorEnd = anchorIdx === nextIdx
          ? textarea.scrollHeight
          : editorPositions[nextIdx]!;
        const previewStart = previewPositions[anchorIdx]!;
        const previewEnd = anchorIdx === nextIdx
          ? scrollEl.scrollHeight
          : previewPositions[nextIdx]!;
        const segmentPct = editorEnd > editorStart
          ? (scrollTop - editorStart) / (editorEnd - editorStart)
          : 0;
        scrollEl.scrollTop = previewStart + segmentPct * (previewEnd - previewStart);
      } else {
        // Fallback to percentage-based sync
        const maxEditor = textarea.scrollHeight - textarea.clientHeight;
        const pct = maxEditor > 0 ? textarea.scrollTop / maxEditor : 0;
        const maxPreview = scrollEl.scrollHeight - scrollEl.clientHeight;
        scrollEl.scrollTop = pct * maxPreview;
      }
    }
    requestAnimationFrame(() => {
      syncing = false;
    });
  };

  const onPreviewScroll = (): void => {
    if (syncing) return;
    syncing = true;
    const doc = iframe.contentDocument;
    const scrollEl = doc?.scrollingElement ?? doc?.documentElement;
    if (scrollEl) {
      const editorPositions = getHeadingLinePositions(textarea);
      const previewPositions = getPreviewHeadingPositions();

      if (previewPositions.length > 0 && editorPositions.length === previewPositions.length) {
        const scrollTop = scrollEl.scrollTop;
        let anchorIdx = 0;
        for (let i = previewPositions.length - 1; i >= 0; i--) {
          if (previewPositions[i]! <= scrollTop + 10) {
            anchorIdx = i;
            break;
          }
        }
        const nextIdx = Math.min(anchorIdx + 1, previewPositions.length - 1);
        const previewStart = previewPositions[anchorIdx]!;
        const previewEnd = anchorIdx === nextIdx
          ? scrollEl.scrollHeight
          : previewPositions[nextIdx]!;
        const editorStart = editorPositions[anchorIdx]!;
        const editorEnd = anchorIdx === nextIdx
          ? textarea.scrollHeight
          : editorPositions[nextIdx]!;
        const segmentPct = previewEnd > previewStart
          ? (scrollTop - previewStart) / (previewEnd - previewStart)
          : 0;
        textarea.scrollTop = editorStart + segmentPct * (editorEnd - editorStart);
      } else {
        const maxPreview = scrollEl.scrollHeight - scrollEl.clientHeight;
        const pct = maxPreview > 0 ? scrollEl.scrollTop / maxPreview : 0;
        const maxEditor = textarea.scrollHeight - textarea.clientHeight;
        textarea.scrollTop = pct * maxEditor;
      }
    }
    requestAnimationFrame(() => {
      syncing = false;
    });
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
  splitActions: HTMLElement
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
  let imageWidthState: Record<string, string> = {};
  let layoutMode: SplitLayoutMode = canUsePreviewFocusLayout()
    ? 'preview-focus'
    : 'balanced';
  let balancedEditorWidth = 700;
  let hasExplicitLayoutPreference = false;
  let checkboxMessageCleanup: (() => void) | null = null;

  const handlePreviewMessage = (event: MessageEvent): void => {
    if (!event.data) return;
    if (event.data.type === 'image-width-state') {
      imageWidthState =
        event.data.widths && typeof event.data.widths === 'object'
          ? { ...event.data.widths }
          : {};
      return;
    }

    if (event.data.type !== 'checkbox-toggle') return;
    const { index, checked } = event.data as { index: number; checked: boolean };
    const lines = textarea.value.split('\n');
    let checkboxCount = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? '';
      const match = line.match(/^(\s*[-*+]\s*)\[([ xX])\]/);
      if (match) {
        if (checkboxCount === index) {
          lines[i] = line.replace(
            /^(\s*[-*+]\s*)\[([ xX])\]/,
            `$1[${checked ? 'x' : ' '}]`
          );
          textarea.value = lines.join('\n');
          textarea.dispatchEvent(new Event('input'));
          break;
        }
        checkboxCount++;
      }
    }
  };

  const parentContainer = container.parentElement;
  const applyLayoutMetrics = (): void => {
    const shellWidth = Math.round(
      layoutMode === 'preview-focus'
        ? balancedEditorWidth * 3
        : balancedEditorWidth * 2
    );

    container.dataset.splitLayout = layoutMode;
    parentContainer?.style.setProperty(
      '--split-shell-width',
      `${shellWidth}px`
    );
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
    const html = generatePreviewHtml(safeHtml, true, imageWidthState);
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
    return [
      container,
      editorPane,
      previewPane,
      splitActions,
    ].filter((element): element is HTMLElement => Boolean(element));
  };

  const getSplitActionItems = (): HTMLElement[] => {
    return Array.from(splitActions.children).filter(
      (child): child is HTMLElement => child instanceof HTMLElement
    );
  };

  const open = (): void => {
    if (isTransitioning) return;
    if (!hasExplicitLayoutPreference) {
      layoutMode = canUsePreviewFocusLayout() ? 'preview-focus' : 'balanced';
    }
    captureBalancedWidth();
    const beforeRects = snapshotRects([container, editorPane]);

    isOpen = true;
    container.classList.remove('single-pane');
    container.classList.add('split-pane');
    parentContainer?.classList.add('split-active');
    editorPane.classList.remove('full-width');
    previewPane.hidden = false;
    splitActions.hidden = false;
    setButtonContent(previewBtn, 'edit', '仅编辑');
    fullRender();
    applyLayoutMetrics();
    textarea.addEventListener('input', debouncedUpdate);
    scrollSync = setupScrollSync(textarea, previewIframe);
    setTimeout(() => scrollSync?.enable(), 150);
    window.addEventListener('message', handlePreviewMessage);
    checkboxMessageCleanup = () =>
      window.removeEventListener('message', handlePreviewMessage);
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
        animateFromRect(
          container,
          beforeRects.get(container) ?? container.getBoundingClientRect()
        ),
        animateFromRect(
          editorPane,
          beforeRects.get(editorPane) ?? editorPane.getBoundingClientRect()
        ),
      ];

      animations.push(
        animateEntrance(previewPane, {
          fromX: 42,
          fromScale: 0.985,
          duration: 360,
        })
      );
      animations.push(
        animateEntrance(splitActions, { fromY: 18, duration: 280 })
      );
      getSplitActionItems().forEach((item, index) => {
        animations.push(
          animateEntrance(item, {
            fromY: 12,
            duration: 260,
            delay: 60 + index * 28,
          })
        );
      });

      await Promise.all(
        animations
          .filter(Boolean)
          .map(animation => animation!.finished.catch(() => undefined))
      );
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
    if (canUseSplitPreview()) {
      setButtonContent(previewBtn, 'preview', '分屏预览');
      previewBtn.title = '打开分屏预览';
    } else {
      setButtonContent(previewBtn, 'external', '新窗口预览');
      previewBtn.title = `当前窗口较窄，将使用新窗口预览（至少 ${SPLIT_PREVIEW_MIN_VIEWPORT}px）`;
    }
    textarea.removeEventListener('input', debouncedUpdate);
    if (scrollSync) {
      scrollSync.disable();
      scrollSync = null;
    }
    if (resizeCleanup) {
      resizeCleanup();
      resizeCleanup = null;
    }
    if (checkboxMessageCleanup) {
      checkboxMessageCleanup();
      checkboxMessageCleanup = null;
    }
  };

  const close = (): void => {
    if (isTransitioning) return;
    if (prefersReducedMotion()) {
      applyClosedState();
      return;
    }

    isTransitioning = true;
    const beforeRects = snapshotRects([container, editorPane]);
    const exitingElements = [
      previewPane,
      splitActions,
      ...getSplitActionItems(),
    ];
    cancelAnimations(exitingElements);

    void (async () => {
      await Promise.all([
        animateExit(previewPane, { toX: 28, toScale: 0.985 }),
        animateExit(splitActions, { toY: 14, toScale: 0.99 }),
      ]);

      applyClosedState();

      await waitForNextFrame();
      cancelAnimations([container, editorPane]);

      const animations = [
        animateFromRect(
          container,
          beforeRects.get(container) ?? container.getBoundingClientRect()
        ),
        animateFromRect(
          editorPane,
          beforeRects.get(editorPane) ?? editorPane.getBoundingClientRect()
        ),
      ];

      await Promise.all(
        animations
          .filter(Boolean)
          .map(animation => animation!.finished.catch(() => undefined))
      );
      isTransitioning = false;
    })();
  };

  const setLayoutMode = (mode: SplitLayoutMode, userInitiated = true): void => {
    if (layoutMode === mode) return;
    if (isTransitioning) return;

    const beforeRects = snapshotRects([
      container,
      editorPane,
      previewPane,
      splitActions,
    ]);

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
        animateFromRect(
          container,
          beforeRects.get(container) ?? container.getBoundingClientRect()
        ),
        animateFromRect(
          editorPane,
          beforeRects.get(editorPane) ?? editorPane.getBoundingClientRect()
        ),
        animateFromRect(
          previewPane,
          beforeRects.get(previewPane) ?? previewPane.getBoundingClientRect()
        ),
        animateFromRect(
          splitActions,
          beforeRects.get(splitActions) ?? splitActions.getBoundingClientRect(),
          {
            opacity: [0.88, 1],
            duration: 300,
          }
        ),
      ];

      await Promise.all(
        animations
          .filter(Boolean)
          .map(animation => animation!.finished.catch(() => undefined))
      );
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
    const currentState = (
      previewIframe.contentWindow as Window & {
        getImageWidthState?: () => Record<string, string>;
      } | null
    )?.getImageWidthState?.();
    if (currentState && typeof currentState === 'object') {
      imageWidthState = { ...currentState };
    }
    return openPreviewInNewTab(textarea, imageWidthState);
  };

  const clickIframeBtn = (id: string): void => {
    const btn = previewIframe.contentDocument?.getElementById(
      id
    ) as HTMLButtonElement | null;
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

function escapeHtmlText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getHistoryPreview(content: string): string {
  const firstLine = content.trim().split('\n')[0] ?? '';
  const raw = firstLine.length <= 60 ? firstLine : `${firstLine.slice(0, 60)}...`;
  return escapeHtmlText(raw);
}

function renderHistoryList(
  listElement: HTMLElement,
  entries: HistoryEntry[],
  onRestore: (entry: HistoryEntry) => Promise<void>
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
                  <button class="app-button history-entry-btn" data-action="restore" data-entry-id="${entry.id}" type="button">${renderButtonContent('restore', '恢复')}</button>
                  <button class="app-button history-entry-btn" data-action="delete" data-entry-id="${entry.id}" type="button">${renderButtonContent('delete', '删除')}</button>
                </div>
              </article>
            `
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

  listElement
    .querySelectorAll<HTMLButtonElement>('[data-action="restore"]')
    .forEach(button => {
      button.addEventListener('click', () => {
        const targetEntry = entries.find(
          entry => entry.id === button.dataset.entryId
        );
        if (targetEntry) {
          void onRestore(targetEntry);
        }
      });
    });

  listElement
    .querySelectorAll<HTMLButtonElement>('[data-action="delete"]')
    .forEach(button => {
      button.addEventListener('click', async () => {
        const targetId = button.dataset.entryId;
        if (!targetId) {
          return;
        }

        const shouldDelete = await showConfirm({
          title: '删除记录',
          message: '确定删除这条历史记录吗？',
          confirmText: '删除',
        });
        if (!shouldDelete) {
          return;
        }

        const nextEntries = deleteHistoryEntry(targetId);
        renderHistoryList(listElement, nextEntries, onRestore);
      });
    });
}

function initHistory(
  textarea: HTMLTextAreaElement,
  onRestore: (content: string) => void
): void {
  const historyToggleBtn =
    requireElement<HTMLButtonElement>('history-toggle-btn');
  const historyCloseBtn =
    requireElement<HTMLButtonElement>('history-close-btn');
  const historyClearBtn =
    requireElement<HTMLButtonElement>('history-clear-btn');
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
  const downloadBtn = requireElement<HTMLButtonElement>(
    'download-markdown-btn'
  );
  const editorContainer = requireElement<HTMLDivElement>('editor-container');
  const editorPane = requireElement<HTMLDivElement>('editor-pane');
  const previewPane = requireElement<HTMLDivElement>('preview-pane');
  const previewIframe = requireElement<HTMLIFrameElement>('preview-iframe');
  const splitActions = requireElement<HTMLDivElement>('split-actions');

  // Action bar buttons
  const actionPagedPdf = requireElement<HTMLButtonElement>('action-paged-pdf');
  const actionSinglePdf =
    requireElement<HTMLButtonElement>('action-single-pdf');
  const actionCopy = requireElement<HTMLButtonElement>('action-copy');
  const actionLongImage =
    requireElement<HTMLButtonElement>('action-long-image');
  const actionNewTab = requireElement<HTMLButtonElement>('action-new-tab');
  const splitViewBalancedBtn = requireElement<HTMLButtonElement>(
    'split-view-balanced'
  );
  const splitViewPreviewFocusBtn = requireElement<HTMLButtonElement>(
    'split-view-preview-focus'
  );

  markdownInput.value = '';

  const platformInfo = getPlatformInfo();
  const modKey = platformInfo.isMac ? '⌘' : 'Ctrl+';
  downloadBtn.title = `下载 MD（${modKey}Enter）`;
  previewBtn.title = `预览（${modKey}P）`;

  const splitPreview = initSplitPreview(
    markdownInput,
    editorContainer,
    editorPane,
    previewPane,
    previewIframe,
    previewBtn,
    splitActions
  );

  const setSplitViewButtonState = (mode: SplitLayoutMode): void => {
    splitViewBalancedBtn.classList.toggle('is-active', mode === 'balanced');
    splitViewBalancedBtn.setAttribute(
      'aria-pressed',
      String(mode === 'balanced')
    );
    splitViewPreviewFocusBtn.classList.toggle(
      'is-active',
      mode === 'preview-focus'
    );
    splitViewPreviewFocusBtn.setAttribute(
      'aria-pressed',
      String(mode === 'preview-focus')
    );
  };

  let lastCanUseSplitPreview = canUseSplitPreview();
  let lastCanUsePreviewFocus = canUsePreviewFocusLayout();
  let actionCopyResetTimer: number | null = null;

  const updatePreviewBtnLabel = (): void => {
    if (splitPreview.isOpen()) {
      setButtonContent(previewBtn, 'edit', '仅编辑');
      previewBtn.title = '仅编辑';
    } else if (canUseSplitPreview()) {
      setButtonContent(previewBtn, 'preview', '分屏预览');
      previewBtn.title = '打开分屏预览';
    } else {
      setButtonContent(previewBtn, 'external', '新窗口预览');
      previewBtn.title = `当前窗口较窄，将使用新窗口预览（至少 ${SPLIT_PREVIEW_MIN_VIEWPORT}px）`;
    }
  };

  const syncSplitPreviewAvailability = (announce = false): void => {
    const splitAllowed = canUseSplitPreview();
    const previewFocusAllowed = canUsePreviewFocusLayout();
    const isSplitPreviewOpen = splitPreview.isOpen();

    splitViewPreviewFocusBtn.disabled = !previewFocusAllowed;
    splitViewPreviewFocusBtn.title = previewFocusAllowed
      ? '保持编辑区不变，扩张预览区到两倍宽'
      : `当前窗口宽度不足，至少 ${PREVIEW_FOCUS_MIN_VIEWPORT}px 可使用 1:2 视图`;

    if (!splitAllowed && isSplitPreviewOpen) {
      splitPreview.close();
      setSplitViewButtonState('balanced');
      if (announce && lastCanUseSplitPreview) {
        showToast(
          `窗口宽度不足，已退出分屏预览。分屏至少需要 ${SPLIT_PREVIEW_MIN_VIEWPORT}px，请使用新窗口预览。`
        );
      }
    } else if (
      !previewFocusAllowed &&
      splitPreview.getLayoutMode() === 'preview-focus'
    ) {
      splitPreview.setSystemLayoutMode('balanced');
      setSplitViewButtonState('balanced');
      if (announce && lastCanUsePreviewFocus && isSplitPreviewOpen) {
        showToast(
          `窗口宽度不足，已切回 1:1 视图。1:2 视图至少需要 ${PREVIEW_FOCUS_MIN_VIEWPORT}px。`
        );
      }
    }

    lastCanUseSplitPreview = splitAllowed;
    lastCanUsePreviewFocus = previewFocusAllowed;
    updatePreviewBtnLabel();
  };

  setSplitViewButtonState(splitPreview.getLayoutMode());
  syncSplitPreviewAvailability();

  downloadBtn.addEventListener('click', () => {
    downloadMarkdown(markdownInput);
  });

  previewBtn.addEventListener('click', () => {
    if (splitPreview.isOpen()) {
      splitPreview.toggle();
      updatePreviewBtnLabel();
      return;
    }

    if (!markdownInput.value.trim()) {
      showToast(UI_TEXT.ERRORS.EMPTY_CONTENT_PREVIEW);
      return;
    }

    if (!canUseSplitPreview()) {
      const opened = splitPreview.openInNewTab();
      if (opened) {
        showToast(
          `当前窗口宽度不足，已改为新窗口预览。分屏至少需要 ${SPLIT_PREVIEW_MIN_VIEWPORT}px。`
        );
      }
      return;
    }

    splitPreview.toggle();
    updatePreviewBtnLabel();
  });

  // Action bar: delegate to iframe buttons
  actionPagedPdf.addEventListener('click', () => {
    splitPreview.clickIframeBtn('download-pdf-btn');
  });
  actionSinglePdf.addEventListener('click', () => {
    splitPreview.clickIframeBtn('download-single-page-pdf-btn');
  });
  actionCopy.addEventListener('click', async () => {
    const copied = await copySplitPreviewContent(previewIframe);
    if (!copied) {
      showErrorToast(UI_TEXT.ERRORS.COPY_FAILED);
      return;
    }

    setButtonContent(actionCopy, 'check', '已复制');
    if (actionCopyResetTimer !== null) {
      window.clearTimeout(actionCopyResetTimer);
    }
    actionCopyResetTimer = window.setTimeout(() => {
      setButtonContent(actionCopy, 'copy', '复制富文本');
      actionCopyResetTimer = null;
    }, 1500);
  });
  actionLongImage.addEventListener('click', () => {
    splitPreview.clickIframeBtn('export-long-image-btn');
  });
  actionNewTab.addEventListener('click', () => {
    if (!markdownInput.value.trim()) {
      showToast(UI_TEXT.ERRORS.EMPTY_CONTENT_PREVIEW);
      return;
    }
    splitPreview.openInNewTab();
  });

  splitViewBalancedBtn.addEventListener('click', () => {
    splitPreview.setLayoutMode('balanced');
    setSplitViewButtonState('balanced');
  });

  splitViewPreviewFocusBtn.addEventListener('click', () => {
    if (!canUsePreviewFocusLayout()) {
      showToast(
        `当前窗口宽度不足，1:2 视图至少需要 ${PREVIEW_FOCUS_MIN_VIEWPORT}px。`
      );
      return;
    }
    splitPreview.setLayoutMode('preview-focus');
    setSplitViewButtonState('preview-focus');
  });

  window.addEventListener(
    'resize',
    debounce(() => {
      syncSplitPreviewAvailability(true);
    }, 120)
  );

  setupKeyboardShortcuts(
    () => downloadMarkdown(markdownInput),
    () => previewBtn.click()
  );

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
