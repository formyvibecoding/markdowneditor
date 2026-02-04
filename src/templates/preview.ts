/**
 * 预览页面模板模块
 * 将 HTML 模板从主逻辑中抽离，提高可维护性
 */

import { CDN_RESOURCES, UI_TEXT, STYLES, A4, PDF_CONFIG } from '../config';

// =============================================================================
// CSS 样式模板
// =============================================================================

const previewStyles = `
body {
  margin: 0;
  padding: 0;
  background-color: ${STYLES.COLORS.BACKGROUND};
}

.preview-controls {
  position: fixed;
  top: 10px;
  right: 20px;
  z-index: 1000;
  display: flex;
  gap: 10px;
}

.pdf-btn {
  color: white;
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
    alert(UI_TEXT.COPY_FAILED);
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
    alert(UI_TEXT.COPY_FAILED);
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
    alert('生成 PDF 时出错: ' + err.message);
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
    alert(msg);
  } finally {
    contentArea.setAttribute('style', originalStyle);
    if (container) container.setAttribute('style', containerStyle);
    enableButtons();
  }
});

if (copyBtn) {
  copyBtn.addEventListener('click', copyPreviewContent);
}

// 预加载库
ensureLibs().catch(() => {});
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
