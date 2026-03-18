/**
 * 预览页面模板模块
 * 将 HTML 模板从主逻辑中抽离，提高可维护性
 */

import {
  CDN_RESOURCES,
  UI_TEXT,
  STYLES,
  A4,
  PDF_CONFIG,
  LONG_IMAGE,
} from '../config';
import { BUTTON_ICONS, renderButtonContent } from '../ui-icons';

// =============================================================================
// CSS 样式模板
// =============================================================================

const previewStyles = `
body {
  --preview-page-max-width: 940px;
  --preview-content-max-width: 900px;
  --preview-button-bg: rgba(255, 255, 255, 0.92);
  --preview-button-bg-hover: #f6efe9;
  --preview-button-border: rgba(92, 62, 46, 0.16);
  --preview-button-border-strong: rgba(92, 62, 46, 0.28);
  margin: 0;
  padding: 0;
  background-color: ${STYLES.COLORS.BACKGROUND};
  font-family: ${STYLES.FONTS.PREVIEW};
}

.preview-controls {
  position: fixed;
  top: 26px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  box-sizing: border-box;
  width: min(calc(100% - 40px), var(--preview-content-max-width));
}

/* When embedded in iframe (split-pane), hide controls and reduce padding */
.embedded .preview-controls {
  display: none;
}

.embedded .container {
  width: 100%;
  max-width: none;
  padding-top: 20px;
}

.embedded .markdown-body {
  width: 90%;
  max-width: none;
}

.preview-toast-container {
  position: fixed;
  top: 56px;
  right: 20px;
  z-index: 1100;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.preview-toast {
  max-width: 320px;
  background: rgba(166, 47, 47, 0.95);
  color: #fff;
  border-radius: 16px;
  padding: 10px 12px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.22);
  font-size: 13px;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.app-button__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.app-button__icon svg {
  width: 18px;
  height: 18px;
  display: block;
}

.app-button__label {
  display: inline-flex;
  align-items: center;
}

.pdf-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 38px;
  padding: 0 15px;
  background: var(--preview-button-bg);
  border: 1px solid var(--preview-button-border);
  color: #5c3e2e;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: transform 0.18s ease, background-color 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease, color 0.18s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  white-space: nowrap;
}

.pdf-btn:hover:not(:disabled) {
  background-color: var(--preview-button-bg-hover);
  border-color: var(--preview-button-border-strong);
  box-shadow: 0 8px 18px rgba(27, 24, 21, 0.1);
  transform: translateY(-1px);
}

.pdf-btn:focus-visible {
  outline: 2px solid rgba(92, 62, 46, 0.42);
  outline-offset: 2px;
}

.pdf-btn:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.pdf-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.container {
  box-sizing: border-box;
  width: min(100%, var(--preview-page-max-width));
  margin: 0 auto;
  padding: 20px 20px 40px;
  padding-top: 66px;
}

.markdown-body {
  box-sizing: border-box;
  background-color: ${STYLES.COLORS.WHITE};
  padding: clamp(28px, 3vw, 36px);
  margin: 0 auto;
  width: 100%;
  max-width: var(--preview-content-max-width);
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  font-family: ${STYLES.FONTS.PREVIEW};
  text-align: left;
}

/* 打印样式 */
@media print {
  .preview-controls,
  .table-copy-btn,
  .code-copy-btn,
  .color-swatch-btn {
    display: none !important;
  }
  body {
    background-color: white !important;
    margin: 0 !important;
    padding: 0 !important;
  }
  .container {
    padding: 0 !important;
    margin: 0 !important;
    max-width: none !important;
  }
  .markdown-body {
    box-shadow: none !important;
    border-radius: 0 !important;
    width: 100% !important;
    max-width: none !important;
    margin: 0 !important;
    padding: 0 !important;
  }
  h1, h2, h3, h4, h5, h6,
  img, table, pre, figure, blockquote,
  ul, ol, dl {
    break-inside: avoid-page;
    page-break-inside: avoid;
  }
  h1, h2 {
    break-after: avoid-page;
    page-break-after: avoid;
  }
  h1 {
    break-before: page;
    page-break-before: page;
  }
}

/* 表格样式 */
.markdown-body table {
  position: relative;
}

.markdown-body .table-with-copy {
  position: relative;
  width: fit-content;
  max-width: 100%;
}

.markdown-body .code-block-with-copy {
  position: relative;
}

.markdown-body .table-with-copy .table-copy-btn,
.markdown-body .code-block-with-copy .code-copy-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 32px;
  padding: 0 11px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 999px;
  font-size: 12px;
  color: #fff;
  background: rgba(33, 37, 41, 0.76);
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.16);
  cursor: pointer;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease, background-color 0.2s ease, transform 0.2s ease;
}

.markdown-body .table-with-copy:hover .table-copy-btn,
.markdown-body .table-with-copy .table-copy-btn:focus-visible,
.markdown-body .code-block-with-copy:hover .code-copy-btn,
.markdown-body .code-block-with-copy .code-copy-btn:focus-visible {
  opacity: 1;
  pointer-events: auto;
}

.markdown-body .table-with-copy .table-copy-btn:hover,
.markdown-body .table-with-copy .table-copy-btn:focus-visible,
.markdown-body .code-block-with-copy .code-copy-btn:hover,
.markdown-body .code-block-with-copy .code-copy-btn:focus-visible {
  background: rgba(33, 37, 41, 0.9);
  transform: translateY(-1px);
}

.markdown-body .table-with-copy .table-copy-btn .app-button__icon svg,
.markdown-body .code-block-with-copy .code-copy-btn .app-button__icon svg {
  width: 14px;
  height: 14px;
}

.markdown-body table th {
  background-color: #e9ecef;
  font-weight: 600;
}

/* 标题样式 */
.markdown-body h1,
.markdown-body h2,
.markdown-body h3,
.markdown-body h4,
.markdown-body h5,
.markdown-body h6 {
  letter-spacing: normal;
  font-family: ${STYLES.FONTS.PREVIEW};
  word-spacing: normal;
}

/* 防止中英文异常间距 */
.markdown-body * {
  word-break: normal;
  overflow-wrap: break-word;
}

.markdown-body .color-code-inline {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.markdown-body .color-swatch-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding: 0;
  border: 1px solid rgba(92, 62, 46, 0.14);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.82);
  box-shadow: 0 1px 2px rgba(27, 24, 21, 0.04);
  cursor: pointer;
  flex-shrink: 0;
}

.markdown-body .color-swatch-btn:hover,
.markdown-body .color-swatch-btn:focus-visible {
  border-color: rgba(92, 62, 46, 0.26);
  box-shadow: 0 6px 14px rgba(27, 24, 21, 0.08);
}

.markdown-body .color-swatch-btn .swatch {
  display: block;
  width: 10px;
  height: 10px;
}
`;

// =============================================================================
// JavaScript 代码模板
// =============================================================================

const previewScript = `
// 获取元素
const contentArea = document.getElementById('preview-content-area');
const pagedBtn = document.getElementById('download-pdf-btn');
const singleBtn = document.getElementById('download-single-page-pdf-btn');
const copyBtn = document.getElementById('copy-preview-btn');

// 配置常量
const A4_WIDTH_MM = ${A4.WIDTH_MM};
const A4_CONTENT_WIDTH_PX = ${A4.CONTENT_WIDTH_PX};
const IMAGE_QUALITY = ${PDF_CONFIG.IMAGE_QUALITY};
const SCALE = ${PDF_CONFIG.SCALE};

// UI 文案
const UI_TEXT = {
  PAGED: '${UI_TEXT.PDF_BUTTONS.PAGED}',
  PAGED_LOADING: '${UI_TEXT.PDF_BUTTONS.PAGED_LOADING}',
  SINGLE: '${UI_TEXT.PDF_BUTTONS.SINGLE}',
  SINGLE_PREPARING: '${UI_TEXT.PDF_BUTTONS.SINGLE_PREPARING}',
  COPY: '${UI_TEXT.COPY_BUTTONS.COPY}',
  COPYING: '${UI_TEXT.COPY_BUTTONS.COPYING}',
  COPIED: '${UI_TEXT.COPY_BUTTONS.COPIED}',
  COPY_FAILED: '${UI_TEXT.ERRORS.COPY_FAILED}',
};

const BUTTON_ICONS = ${JSON.stringify(BUTTON_ICONS)};

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderButtonContent(icon, label) {
  return '<span class="app-button__icon" aria-hidden="true">' + BUTTON_ICONS[icon] + '</span>'
    + '<span class="app-button__label">' + escapeHtml(label) + '</span>';
}

function setButtonContent(button, icon, label) {
  if (!button) return;
  button.innerHTML = renderButtonContent(icon, label);
}

// CDN 资源（带回退）
const CDN = {
  html2canvas: ${JSON.stringify(CDN_RESOURCES.HTML2CANVAS)},
  jspdf: ${JSON.stringify(CDN_RESOURCES.JSPDF)},
  html2pdf: ${JSON.stringify(CDN_RESOURCES.HTML2PDF)},
};

// 加载脚本（带回退）
async function loadScript(urls) {
  for (const url of urls) {
    try {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
      return;
    } catch (e) {
      continue;
    }
  }
  throw new Error('所有 CDN 源加载失败');
}

// 加载所有依赖
let libsLoaded = false;
async function ensureLibs() {
  if (libsLoaded) return;
  await Promise.all([
    loadScript(CDN.html2canvas),
    loadScript(CDN.jspdf),
    loadScript(CDN.html2pdf),
  ]);
  libsLoaded = true;
}

// 按钮状态管理
function disableButtons(loadingText) {
  pagedBtn.disabled = true;
  singleBtn.disabled = true;
  setButtonContent(pagedBtn, 'pagedPdf', loadingText);
}

function enableButtons() {
  pagedBtn.disabled = false;
  singleBtn.disabled = false;
  setButtonContent(pagedBtn, 'pagedPdf', UI_TEXT.PAGED);
  setButtonContent(singleBtn, 'singlePage', UI_TEXT.SINGLE);
}

function setCopyButtonState(text, disabled) {
  if (!copyBtn) return;
  setButtonContent(copyBtn, text === UI_TEXT.COPIED ? 'check' : 'copy', text);
  copyBtn.disabled = disabled;
}

function showErrorToast(message) {
  let container = document.querySelector('.preview-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'preview-toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = 'preview-toast';
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 2200);
}

function restoreSelection(selection, ranges) {
  if (!selection) return;
  selection.removeAllRanges();
  ranges.forEach((range) => selection.addRange(range));
}

function syncCheckboxAttributes(container) {
  const inputs = container.querySelectorAll('input[type="checkbox"]');
  return Array.from(inputs).map((input) => {
    const hadAttr = input.hasAttribute('checked');
    if (input.checked) {
      input.setAttribute('checked', '');
    } else {
      input.removeAttribute('checked');
    }
    return { input, hadAttr };
  });
}

function restoreCheckboxAttributes(states) {
  states.forEach(({ input, hadAttr }) => {
    if (hadAttr) {
      input.setAttribute('checked', '');
    } else {
      input.removeAttribute('checked');
    }
  });
}

function wrapTablesWithCopyButton() {
  if (!contentArea) return;
  const tables = contentArea.querySelectorAll('table');

  tables.forEach((table) => {
    if (table.closest('.table-with-copy')) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'table-with-copy';

    const copyTableButton = document.createElement('button');
    copyTableButton.className = 'table-copy-btn';
    copyTableButton.type = 'button';
    copyTableButton.setAttribute('aria-label', '复制表格');
    setButtonContent(copyTableButton, 'table', '复制表格');

    copyTableButton.addEventListener('click', async (event) => {
      event.preventDefault();
      event.stopPropagation();
      const tableHtml = table.outerHTML;
      const tableText = table.innerText;
      let copied = false;

      try {
        if (navigator.clipboard && window.ClipboardItem) {
          await navigator.clipboard.write([
            new ClipboardItem({
              'text/html': new Blob([tableHtml], { type: 'text/html' }),
              'text/plain': new Blob([tableText], { type: 'text/plain' }),
            }),
          ]);
          copied = true;
        } else if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(tableText);
          copied = true;
        }
      } catch (err) {
        copied = false;
      }

      if (!copied) {
        showErrorToast(UI_TEXT.COPY_FAILED);
        return;
      }

      setButtonContent(copyTableButton, 'check', '已复制');
      copyTableButton.disabled = true;
      setTimeout(() => {
        setButtonContent(copyTableButton, 'table', '复制表格');
        copyTableButton.disabled = false;
      }, 1200);
    });

    table.parentNode?.insertBefore(wrapper, table);
    wrapper.appendChild(table);
    wrapper.appendChild(copyTableButton);
  });
}

function wrapCodeBlocksWithCopyButton() {
  if (!contentArea) return;
  const blocks = contentArea.querySelectorAll('pre');

  blocks.forEach((block) => {
    if (block.closest('.code-block-with-copy')) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'code-block-with-copy';

    const copyCodeButton = document.createElement('button');
    copyCodeButton.className = 'code-copy-btn';
    copyCodeButton.type = 'button';
    copyCodeButton.setAttribute('aria-label', '复制代码');
    setButtonContent(copyCodeButton, 'code', '复制代码');

    copyCodeButton.addEventListener('click', async (event) => {
      event.preventDefault();
      event.stopPropagation();

      const codeText = block.innerText;
      let copied = false;

      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(codeText);
          copied = true;
        }
      } catch (err) {
        copied = false;
      }

      if (!copied) {
        showErrorToast(UI_TEXT.COPY_FAILED);
        return;
      }

      setButtonContent(copyCodeButton, 'check', '已复制');
      copyCodeButton.disabled = true;
      setTimeout(() => {
        setButtonContent(copyCodeButton, 'code', '复制代码');
        copyCodeButton.disabled = false;
      }, 1200);
    });

    block.parentNode?.insertBefore(wrapper, block);
    wrapper.appendChild(block);
    wrapper.appendChild(copyCodeButton);
  });
}

function createColorSwatchButton(colorCode) {
  const button = document.createElement('button');
  button.className = 'color-swatch-btn';
  button.type = 'button';
  button.setAttribute('title', '点击复制颜色值 ' + colorCode);
  button.setAttribute('aria-label', '复制颜色值 ' + colorCode);

  const svgNs = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNs, 'svg');
  svg.setAttribute('class', 'swatch');
  svg.setAttribute('width', '10');
  svg.setAttribute('height', '10');
  svg.setAttribute('viewBox', '0 0 10 10');

  const rect = document.createElementNS(svgNs, 'rect');
  rect.setAttribute('width', '10');
  rect.setAttribute('height', '10');
  rect.setAttribute('fill', colorCode);
  rect.setAttribute('stroke', '#e0e0e6');
  rect.setAttribute('stroke-width', '1');
  rect.setAttribute('rx', '2');

  svg.appendChild(rect);
  button.appendChild(svg);

  button.addEventListener('click', async (event) => {
    event.preventDefault();
    event.stopPropagation();

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(colorCode);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = colorCode;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        textarea.remove();
      }
    } catch (err) {
      showErrorToast(UI_TEXT.COPY_FAILED);
    }
  });

  return button;
}

function enhanceColorCodes() {
  if (!contentArea) return;

  const walker = document.createTreeWalker(contentArea, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  let node = walker.nextNode();

  while (node) {
    const parentElement = node.parentElement;
    if (
      parentElement &&
      !parentElement.closest('.color-code-inline') &&
      /#[0-9a-fA-F]{6}\\b/.test(node.textContent || '')
    ) {
      textNodes.push(node);
    }
    node = walker.nextNode();
  }

  const colorPattern = /#[0-9a-fA-F]{6}\\b/g;

  textNodes.forEach((textNode) => {
    const text = textNode.textContent || '';
    const fragment = document.createDocumentFragment();
    let lastIndex = 0;
    let match;

    while ((match = colorPattern.exec(text)) !== null) {
      if (match.index > lastIndex) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
      }

      const colorCode = match[0];
      const wrapper = document.createElement('span');
      wrapper.className = 'color-code-inline';

      wrapper.appendChild(createColorSwatchButton(colorCode));
      wrapper.appendChild(document.createTextNode(colorCode));
      fragment.appendChild(wrapper);

      lastIndex = match.index + colorCode.length;
    }

    if (lastIndex < text.length) {
      fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
    }

    textNode.parentNode?.replaceChild(fragment, textNode);
  });
}

function buildClipboardPayload(container) {
  const clone = container.cloneNode(true);
  const liveInputs = container.querySelectorAll('input[type="checkbox"]');
  const cloneInputs = clone.querySelectorAll('input[type="checkbox"]');
  liveInputs.forEach((input, index) => {
    const cloneInput = cloneInputs[index];
    if (!cloneInput) return;
    if (input.checked) {
      cloneInput.setAttribute('checked', '');
    } else {
      cloneInput.removeAttribute('checked');
    }
  });
  clone.querySelectorAll('.table-copy-btn, .code-copy-btn, .color-swatch-btn').forEach((el) => el.remove());

  return {
    html: clone.innerHTML,
    text: clone.innerText,
  };
}

async function copyPreviewContent() {
  if (!copyBtn || !contentArea) return;
  setCopyButtonState(UI_TEXT.COPYING, true);

  const selection = window.getSelection();
  if (!selection) {
    showErrorToast(UI_TEXT.COPY_FAILED);
    setCopyButtonState(UI_TEXT.COPY, false);
    return;
  }

  const previousRanges = [];
  for (let i = 0; i < selection.rangeCount; i += 1) {
    previousRanges.push(selection.getRangeAt(i));
  }

  const checkboxStates = syncCheckboxAttributes(contentArea);
  const { html, text } = buildClipboardPayload(contentArea);

  let success = false;
  try {
    if (navigator.clipboard && window.ClipboardItem) {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([text], { type: 'text/plain' }),
        }),
      ]);
      success = true;
    } else {
      const range = document.createRange();
      range.selectNodeContents(contentArea);
      selection.removeAllRanges();
      selection.addRange(range);
      success = document.execCommand('copy');
    }
  } catch (err) {
    success = false;
  } finally {
    restoreSelection(selection, previousRanges);
    restoreCheckboxAttributes(checkboxStates);
  }

  if (!success) {
    showErrorToast(UI_TEXT.COPY_FAILED);
    setCopyButtonState(UI_TEXT.COPY, false);
    return;
  }

  setCopyButtonState(UI_TEXT.COPIED, true);
  setTimeout(() => {
    setCopyButtonState(UI_TEXT.COPY, false);
  }, 1500);
}

// 分页 PDF 生成
pagedBtn.addEventListener('click', async () => {
  disableButtons(UI_TEXT.PAGED_LOADING);
  const originalStyle = contentArea.getAttribute('style') || '';

  try {
    await ensureLibs();

    contentArea.style.width = A4_CONTENT_WIDTH_PX + 'px';
    contentArea.style.margin = '0 auto';
    contentArea.style.padding = '10mm';

    const opt = {
      margin: [${PDF_CONFIG.PAGED_MARGINS.join(', ')}],
      filename: '${PDF_CONFIG.PAGED_FILENAME}',
      image: { type: 'jpeg', quality: IMAGE_QUALITY },
      enableLinks: true,
      html2canvas: {
        scale: SCALE,
        useCORS: true,
        logging: false,
        letterRendering: true,
        allowTaint: false,
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait',
        compress: true,
      },
      pagebreak: {
        mode: ['avoid-all', 'css', 'legacy'],
        before: '.page-break-before',
        after: '.page-break-after',
        avoid: ['img', 'svg', 'canvas', 'table', 'tr', 'th', 'td', 'pre', 'code', 'blockquote', 'figure', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'dd', 'dt', 'br', '.avoid-page-break'],
      },
    };

    await html2pdf()
      .from(contentArea)
      .set(opt)
      .toPdf()
      .get('pdf')
      .then((pdf) => {
        const totalPages = pdf.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
          pdf.setPage(i);
          pdf.setFontSize(${STYLES.PAGE_NUMBER_FONT_SIZE});
          pdf.setTextColor(${STYLES.COLORS.PAGE_NUMBER.R}, ${STYLES.COLORS.PAGE_NUMBER.G}, ${STYLES.COLORS.PAGE_NUMBER.B});
          pdf.text(
            '' + i + ' / ' + totalPages,
            pdf.internal.pageSize.getWidth() - 30,
            pdf.internal.pageSize.getHeight() - 8
          );
        }
        return pdf;
      })
      .save();
  } catch (err) {
    console.error('PDF 生成失败:', err);
    showErrorToast('生成 PDF 时出错: ' + err.message);
  } finally {
    contentArea.setAttribute('style', originalStyle);
    enableButtons();
  }
});

// 单页 PDF（window.print 真实文字 PDF）
singleBtn.addEventListener('click', () => {
  singleBtn.disabled = true;
  setButtonContent(singleBtn, 'singlePage', UI_TEXT.SINGLE_PREPARING);

  try {
    // 创建隐藏克隆以在打印宽度下测量内容高度
    const clone = contentArea.cloneNode(true);
    clone.style.position = 'absolute';
    clone.style.left = '-99999px';
    clone.style.top = '0';
    clone.style.width = '680px'; // 180mm (A4 210mm - 15mm*2 margin) at 96dpi
    clone.style.maxWidth = '680px';
    clone.style.padding = '0';
    clone.style.margin = '0';
    clone.style.boxShadow = 'none';
    clone.style.borderRadius = '0';
    clone.style.visibility = 'hidden';
    document.body.appendChild(clone);

    const contentHeightPx = clone.scrollHeight;
    document.body.removeChild(clone);

    // px → mm 转换 (1 CSS px = 1/96 inch = 0.264583mm)
    const PX_TO_MM = 0.264583;
    const marginMm = 15;
    const contentHeightMm = contentHeightPx * PX_TO_MM;
    const pageHeightMm = Math.ceil(contentHeightMm) + (marginMm * 2) + 10; // +10mm buffer

    // 注入单页打印样式
    const printStyle = document.createElement('style');
    printStyle.id = 'single-page-print-css';
    printStyle.textContent =
      '@page { size: 210mm ' + pageHeightMm + 'mm; margin: ' + marginMm + 'mm; }' +
      '@media print {' +
      '  h1, h2, h3, h4, h5, h6,' +
      '  img, table, pre, figure, blockquote,' +
      '  ul, ol, dl {' +
      '    break-inside: auto !important;' +
      '    page-break-inside: auto !important;' +
      '  }' +
      '  h1, h2 {' +
      '    break-after: auto !important;' +
      '    page-break-after: auto !important;' +
      '  }' +
      '  h1 {' +
      '    break-before: auto !important;' +
      '    page-break-before: auto !important;' +
      '  }' +
      '}';
    document.head.appendChild(printStyle);

    // 恢复按钮状态后再打印，避免按钮被禁用时打印
    singleBtn.disabled = false;
    setButtonContent(singleBtn, 'singlePage', UI_TEXT.SINGLE);

    window.print();

    // afterprint 清理动态样式
    const cleanup = () => {
      const el = document.getElementById('single-page-print-css');
      if (el) el.remove();
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
  } catch (err) {
    console.error('准备打印失败:', err);
    showErrorToast('准备打印时出错: ' + (err.message || err));
    singleBtn.disabled = false;
    setButtonContent(singleBtn, 'singlePage', UI_TEXT.SINGLE);
  }
});

if (copyBtn) {
  copyBtn.addEventListener('click', copyPreviewContent);
}

wrapTablesWithCopyButton();
wrapCodeBlocksWithCopyButton();
enhanceColorCodes();

// Expose for incremental updates from parent
window.wrapTablesWithCopyButton = wrapTablesWithCopyButton;
window.wrapCodeBlocksWithCopyButton = wrapCodeBlocksWithCopyButton;
window.enhanceColorCodes = enhanceColorCodes;

// 预加载库
ensureLibs().catch(() => {});

// =============================================================================
// 长图导出
// =============================================================================
const longImageBtn = document.getElementById('export-long-image-btn');

const LONG_IMAGE_WIDTH = ${LONG_IMAGE.WIDTH_PX};
const LONG_IMAGE_SCALE = ${LONG_IMAGE.SCALE};
const LONG_IMAGE_PADDING = ${LONG_IMAGE.PADDING};
const LONG_IMAGE_HEADER_PADDING = ${LONG_IMAGE.HEADER_PADDING};
const LONG_IMAGE_FOOTER_PADDING = ${LONG_IMAGE.FOOTER_PADDING};
const LONG_IMAGE_WATERMARK = '${LONG_IMAGE.WATERMARK_TEXT}';
const LONG_IMAGE_FILENAME_PREFIX = '${LONG_IMAGE.FILENAME_PREFIX}';

const LONG_IMAGE_UI = {
  DEFAULT: '${UI_TEXT.LONG_IMAGE_BUTTONS.DEFAULT}',
  RENDERING: '${UI_TEXT.LONG_IMAGE_BUTTONS.RENDERING}',
  GENERATING: '${UI_TEXT.LONG_IMAGE_BUTTONS.GENERATING}',
};

function disableAllButtons(loadingBtn, loadingText) {
  pagedBtn.disabled = true;
  singleBtn.disabled = true;
  if (copyBtn) copyBtn.disabled = true;
  if (longImageBtn) longImageBtn.disabled = true;
  if (loadingBtn === longImageBtn) {
    setButtonContent(loadingBtn, 'image', loadingText);
  }
}

function enableAllButtons() {
  pagedBtn.disabled = false;
  singleBtn.disabled = false;
  if (copyBtn) copyBtn.disabled = false;
  if (longImageBtn) {
    longImageBtn.disabled = false;
    setButtonContent(longImageBtn, 'image', LONG_IMAGE_UI.DEFAULT);
  }
  setButtonContent(pagedBtn, 'pagedPdf', UI_TEXT.PAGED);
  setButtonContent(singleBtn, 'singlePage', UI_TEXT.SINGLE);
}

function generateTimestamp() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return now.getFullYear() + pad(now.getMonth() + 1) + pad(now.getDate())
    + pad(now.getHours()) + pad(now.getMinutes()) + pad(now.getSeconds());
}

function formatDate() {
  const now = new Date();
  return now.getFullYear() + '-'
    + String(now.getMonth() + 1).padStart(2, '0') + '-'
    + String(now.getDate()).padStart(2, '0');
}

if (longImageBtn) {
  longImageBtn.addEventListener('click', async () => {
    disableAllButtons(longImageBtn, LONG_IMAGE_UI.RENDERING);

    try {
      await ensureLibs();

      // 提取标题：优先取第一个 h1，否则 h2，否则用默认
      const h1 = contentArea.querySelector('h1');
      const h2 = contentArea.querySelector('h2');
      const title = (h1 && h1.textContent.trim()) || (h2 && h2.textContent.trim()) || 'Markdown';

      // 创建离屏容器
      const offscreen = document.createElement('div');
      offscreen.style.cssText = 'position:absolute;left:-9999px;top:0;z-index:-1;';
      document.body.appendChild(offscreen);

      // 内层容器（控制宽度）
      const wrapper = document.createElement('div');
      wrapper.style.cssText = [
        'width:' + LONG_IMAGE_WIDTH + 'px',
        'background:#ffffff',
        'font-family:' + ${JSON.stringify(STYLES.FONTS.PREVIEW)},
        'color:#333',
        'overflow:hidden',
      ].join(';');
      offscreen.appendChild(wrapper);

      // 头部区域
      const header = document.createElement('div');
      header.style.cssText = [
        'padding:' + LONG_IMAGE_HEADER_PADDING + 'px ' + LONG_IMAGE_PADDING + 'px',
        'border-bottom:1px solid #e8e8e8',
      ].join(';');
      header.innerHTML = '<div style="font-size:20px;font-weight:700;color:#2c3e50;margin-bottom:6px;line-height:1.4;word-break:break-word;">'
        + title.replace(/</g, '&lt;').replace(/>/g, '&gt;')
        + '</div>'
        + '<div style="font-size:12px;color:#999;">' + formatDate() + '</div>';
      wrapper.appendChild(header);

      // 正文区域 — 克隆预览内容（排除额外 UI 元素）
      const body = document.createElement('div');
      body.className = 'markdown-body';
      body.style.cssText = [
        'padding:' + LONG_IMAGE_PADDING + 'px',
        'background:#ffffff',
        'box-shadow:none',
        'border-radius:0',
        'width:100%',
        'box-sizing:border-box',
      ].join(';');
      body.innerHTML = contentArea.innerHTML;
      // 移除克隆中的 UI 按钮（如复制按钮、颜色按钮）
      body.querySelectorAll('.table-copy-btn, .code-copy-btn, .color-swatch-btn').forEach(el => el.remove());
      wrapper.appendChild(body);

      // 底部水印
      const footer = document.createElement('div');
      footer.style.cssText = [
        'padding:' + LONG_IMAGE_FOOTER_PADDING + 'px ' + LONG_IMAGE_PADDING + 'px',
        'text-align:center',
        'font-size:11px',
        'color:#bbb',
        'border-top:1px solid #e8e8e8',
      ].join(';');
      footer.textContent = LONG_IMAGE_WATERMARK;
      wrapper.appendChild(footer);

      // 等待图片加载
      const imgs = wrapper.querySelectorAll('img');
      if (imgs.length > 0) {
        await Promise.allSettled(
          Array.from(imgs).map(img => {
            if (img.complete) return Promise.resolve();
            return new Promise(resolve => {
              img.onload = resolve;
              img.onerror = resolve;
            });
          })
        );
      }

      setButtonContent(longImageBtn, 'image', LONG_IMAGE_UI.GENERATING);

      // html2canvas 截图
      const canvas = await html2canvas(wrapper, {
        scale: LONG_IMAGE_SCALE,
        useCORS: true,
        logging: false,
        allowTaint: false,
        backgroundColor: '#ffffff',
        width: LONG_IMAGE_WIDTH,
        windowWidth: LONG_IMAGE_WIDTH,
      });

      // 清理离屏容器
      document.body.removeChild(offscreen);

      // 导出 PNG 并下载
      canvas.toBlob(function(blob) {
        if (!blob) {
          showErrorToast('图片生成失败');
          enableAllButtons();
          return;
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = LONG_IMAGE_FILENAME_PREFIX + '-' + generateTimestamp() + '.png';
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }, 100);
        enableAllButtons();
      }, 'image/png');

    } catch (err) {
      console.error('长图导出失败:', err);
      showErrorToast('导出长图时出错: ' + (err.message || err));
      enableAllButtons();
    }
  });
}
`;

// =============================================================================
// 模板生成函数
// =============================================================================

/**
 * 生成预览页面 HTML
 * @param htmlContent 渲染后的 HTML 内容
 * @param embedded 是否嵌入 iframe（隐藏控件，减少 padding）
 * @returns 完整的预览页面 HTML
 */
export function generatePreviewHtml(
  htmlContent: string,
  embedded = false
): string {
  const bodyClass = embedded ? ' class="embedded"' : '';
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Markdown 预览</title>
  <link rel="stylesheet" href="${CDN_RESOURCES.GITHUB_MARKDOWN_CSS}">
  <style>${previewStyles}</style>
</head>
<body${bodyClass}>
  <div class="preview-controls">
    <button id="download-pdf-btn" class="pdf-btn" type="button">${renderButtonContent('pagedPdf', UI_TEXT.PDF_BUTTONS.PAGED)}</button>
    <button id="download-single-page-pdf-btn" class="pdf-btn" type="button">${renderButtonContent('singlePage', UI_TEXT.PDF_BUTTONS.SINGLE)}</button>
    <button id="copy-preview-btn" class="pdf-btn" type="button">${renderButtonContent('copy', UI_TEXT.COPY_BUTTONS.COPY)}</button>
    <button id="export-long-image-btn" class="pdf-btn" type="button">${renderButtonContent('image', UI_TEXT.LONG_IMAGE_BUTTONS.DEFAULT)}</button>
  </div>
  <div class="container">
    <article class="markdown-body" id="preview-content-area">
      ${htmlContent}
    </article>
  </div>
  <script>${previewScript}</script>
</body>
</html>`;
}
