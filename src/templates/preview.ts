/**
 * 预览页面模板模块
 * 将 HTML 模板从主逻辑中抽离，提高可维护性
 */

import { CDN_RESOURCES, UI_TEXT, STYLES, A4, PDF_CONFIG, LONG_IMAGE } from '../config';

// =============================================================================
// CSS 样式模板
// =============================================================================

const previewStyles = `
body {
  margin: 0;
  padding: 0;
  background-color: ${STYLES.COLORS.BACKGROUND};
  font-family: ${STYLES.FONTS.PREVIEW};
}

.preview-controls {
  position: fixed;
  top: 10px;
  right: 20px;
  z-index: 1000;
  display: flex;
  gap: 10px;
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
  border-radius: 8px;
  padding: 10px 12px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.22);
  font-size: 13px;
}

.pdf-btn {
  color: white;
  font-family: ${STYLES.FONTS.PREVIEW};
  border: none;
  border-radius: 4px;
  padding: 8px 15px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
}

.pdf-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

#download-pdf-btn {
  background-color: ${STYLES.COLORS.PDF_BUTTON_PAGED};
}

#download-pdf-btn:hover:not(:disabled) {
  background-color: ${STYLES.COLORS.PDF_BUTTON_PAGED_HOVER};
}

#download-single-page-pdf-btn {
  background-color: ${STYLES.COLORS.PDF_BUTTON_SINGLE};
}

#download-single-page-pdf-btn:hover:not(:disabled) {
  background-color: ${STYLES.COLORS.PDF_BUTTON_SINGLE_HOVER};
}

#copy-preview-btn {
  background-color: ${STYLES.COLORS.COPY_BUTTON};
}

#copy-preview-btn:hover:not(:disabled) {
  background-color: ${STYLES.COLORS.COPY_BUTTON_HOVER};
}

#export-long-image-btn {
  background-color: ${STYLES.COLORS.LONG_IMAGE_BUTTON};
}

#export-long-image-btn:hover:not(:disabled) {
  background-color: ${STYLES.COLORS.LONG_IMAGE_BUTTON_HOVER};
}

.container {
  max-width: 100%;
  margin: 0 auto;
  padding: 20px;
  padding-top: 70px;
}

.markdown-body {
  box-sizing: border-box;
  background-color: ${STYLES.COLORS.WHITE};
  padding: 30px;
  margin: 0 auto;
  width: 90%;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  font-family: ${STYLES.FONTS.PREVIEW};
  text-align: left;
}

/* 分页打印样式 */
@media print {
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

.markdown-body .table-with-copy .table-copy-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 12px;
  line-height: 1.2;
  color: #fff;
  background: rgba(33, 37, 41, 0.75);
  cursor: pointer;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease, background-color 0.2s ease;
}

.markdown-body .table-with-copy:hover .table-copy-btn,
.markdown-body .table-with-copy .table-copy-btn:focus-visible {
  opacity: 1;
  pointer-events: auto;
}

.markdown-body .table-with-copy .table-copy-btn:hover,
.markdown-body .table-with-copy .table-copy-btn:focus-visible {
  background: rgba(33, 37, 41, 0.9);
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
  width: 10px;
  height: 10px;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  flex-shrink: 0;
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
  SINGLE_RENDERING: '${UI_TEXT.PDF_BUTTONS.SINGLE_RENDERING}',
  SINGLE_GENERATING: '${UI_TEXT.PDF_BUTTONS.SINGLE_GENERATING}',
  COPY: '${UI_TEXT.COPY_BUTTONS.COPY}',
  COPYING: '${UI_TEXT.COPY_BUTTONS.COPYING}',
  COPIED: '${UI_TEXT.COPY_BUTTONS.COPIED}',
  COPY_FAILED: '${UI_TEXT.ERRORS.COPY_FAILED}',
};

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
  pagedBtn.textContent = loadingText;
}

function enableButtons() {
  pagedBtn.disabled = false;
  singleBtn.disabled = false;
  pagedBtn.textContent = UI_TEXT.PAGED;
  singleBtn.textContent = UI_TEXT.SINGLE;
}

function setCopyButtonState(text, disabled) {
  if (!copyBtn) return;
  copyBtn.textContent = text;
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
    copyTableButton.textContent = '复制表格';
    copyTableButton.setAttribute('aria-label', '复制表格');

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

      const originalText = copyTableButton.textContent;
      copyTableButton.textContent = '已复制';
      copyTableButton.disabled = true;
      setTimeout(() => {
        copyTableButton.textContent = originalText || '复制表格';
        copyTableButton.disabled = false;
      }, 1200);
    });

    table.parentNode?.insertBefore(wrapper, table);
    wrapper.appendChild(table);
    wrapper.appendChild(copyTableButton);
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
            '第 ' + i + ' 页 / 共 ' + totalPages + ' 页',
            pdf.internal.pageSize.getWidth() - 60,
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

// 单页 PDF 生成
singleBtn.addEventListener('click', async () => {
  pagedBtn.disabled = true;
  singleBtn.disabled = true;
  singleBtn.textContent = UI_TEXT.SINGLE_RENDERING;

  const originalStyle = contentArea.getAttribute('style') || '';
  const container = document.querySelector('.container');
  const containerStyle = container ? container.getAttribute('style') || '' : '';

  try {
    await ensureLibs();

    contentArea.style.width = A4_CONTENT_WIDTH_PX + 'px';
    contentArea.style.margin = '0 auto';
    contentArea.style.padding = '10mm';
    contentArea.style.overflow = 'visible';
    contentArea.style.boxShadow = 'none';

    const canvas = await html2canvas(contentArea, {
      scale: SCALE,
      useCORS: true,
      logging: false,
      allowTaint: false,
      backgroundColor: '#ffffff',
      letterRendering: true,
      width: A4_CONTENT_WIDTH_PX,
      windowWidth: A4_CONTENT_WIDTH_PX,
      height: contentArea.scrollHeight,
      x: 0,
      y: 0,
    });

    singleBtn.textContent = UI_TEXT.SINGLE_GENERATING;

    const imgData = canvas.toDataURL('image/jpeg', IMAGE_QUALITY);
    const pdfWidth = A4_WIDTH_MM;
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [pdfWidth, pdfHeight],
      compress: true,
    });

    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    pdf.save('${PDF_CONFIG.SINGLE_PAGE_FILENAME}');
  } catch (err) {
    console.error('单页 PDF 生成失败:', err);
    let msg = '生成 PDF 时出错: ' + err.message;
    if (err.message && err.message.includes('CORS')) {
      msg = '可能存在跨域图片加载问题，请检查浏览器控制台。';
    }
    showErrorToast(msg);
  } finally {
    contentArea.setAttribute('style', originalStyle);
    if (container) container.setAttribute('style', containerStyle);
    enableButtons();
  }
});

if (copyBtn) {
  copyBtn.addEventListener('click', copyPreviewContent);
}

wrapTablesWithCopyButton();
enhanceColorCodes();

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
  loadingBtn.textContent = loadingText;
}

function enableAllButtons() {
  pagedBtn.disabled = false;
  singleBtn.disabled = false;
  if (copyBtn) copyBtn.disabled = false;
  if (longImageBtn) {
    longImageBtn.disabled = false;
    longImageBtn.textContent = LONG_IMAGE_UI.DEFAULT;
  }
  pagedBtn.textContent = UI_TEXT.PAGED;
  singleBtn.textContent = UI_TEXT.SINGLE;
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

      // 正文区域 — 克隆预览内容（排除 swatch 按钮等 UI 元素）
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
      // 移除克隆中的 UI 按钮（如 table-copy-btn、color-swatch-btn）
      body.querySelectorAll('.table-copy-btn, .color-swatch-btn').forEach(el => el.remove());
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

      longImageBtn.textContent = LONG_IMAGE_UI.GENERATING;

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
 * @returns 完整的预览页面 HTML
 */
export function generatePreviewHtml(htmlContent: string): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Markdown 预览</title>
  <link rel="stylesheet" href="${CDN_RESOURCES.GITHUB_MARKDOWN_CSS}">
  <style>${previewStyles}</style>
</head>
<body>
  <div class="preview-controls">
    <button id="download-pdf-btn" class="pdf-btn">${UI_TEXT.PDF_BUTTONS.PAGED}</button>
    <button id="download-single-page-pdf-btn" class="pdf-btn">${UI_TEXT.PDF_BUTTONS.SINGLE}</button>
    <button id="copy-preview-btn" class="pdf-btn">${UI_TEXT.COPY_BUTTONS.COPY}</button>
    <button id="export-long-image-btn" class="pdf-btn">${UI_TEXT.LONG_IMAGE_BUTTONS.DEFAULT}</button>
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
