/**
 * PDF 生成模块
 * 处理分页和单页 PDF 的生成逻辑
 */

import { A4, PDF_CONFIG, UI_TEXT, STYLES, CDN_RESOURCES } from './config';
import { loadScriptWithFallback } from './utils';

// =============================================================================
// 类型定义
// =============================================================================

/** html2pdf 库类型 */
interface Html2Pdf {
  (): Html2PdfInstance;
}

interface Html2PdfInstance {
  from(element: HTMLElement): Html2PdfInstance;
  set(options: Html2PdfOptions): Html2PdfInstance;
  toPdf(): Html2PdfInstance;
  get(type: 'pdf'): Promise<JsPDF>;
  save(): Promise<void>;
  then<T>(fn: (value: unknown) => T): Html2PdfInstance;
  catch(fn: (error: Error) => void): Html2PdfInstance;
  finally(fn: () => void): Html2PdfInstance;
}

interface Html2PdfOptions {
  margin: readonly number[];
  filename: string;
  image: { type: string; quality: number };
  enableLinks: boolean;
  html2canvas: {
    scale: number;
    useCORS: boolean;
    logging: boolean;
    letterRendering: boolean;
    allowTaint: boolean;
  };
  jsPDF: {
    unit: string;
    format: string;
    orientation: string;
    compress: boolean;
  };
  pagebreak: {
    mode: readonly string[];
    before: string;
    after: string;
    avoid: readonly string[];
  };
}

/** jsPDF 库类型 */
interface JsPDF {
  internal: {
    getNumberOfPages(): number;
    pageSize: {
      getWidth(): number;
      getHeight(): number;
    };
  };
  setPage(page: number): void;
  setFontSize(size: number): void;
  setTextColor(r: number, g: number, b: number): void;
  text(text: string, x: number, y: number): void;
  addImage(
    data: string,
    format: string,
    x: number,
    y: number,
    width: number,
    height: number
  ): void;
  save(filename: string): void;
}

interface JsPDFConstructor {
  new (options: {
    orientation: string;
    unit: string;
    format: [number, number];
    compress: boolean;
  }): JsPDF;
}

/** html2canvas 库类型 */
interface Html2Canvas {
  (element: HTMLElement, options: Html2CanvasOptions): Promise<HTMLCanvasElement>;
}

interface Html2CanvasOptions {
  scale: number;
  useCORS: boolean;
  logging: boolean;
  allowTaint: boolean;
  backgroundColor: string;
  letterRendering: boolean;
  width: number;
  windowWidth: number;
  height: number;
  x: number;
  y: number;
}

/** 按钮状态管理 */
interface ButtonState {
  pagedBtn: HTMLButtonElement;
  singleBtn: HTMLButtonElement;
}

// =============================================================================
// CDN 库加载状态
// =============================================================================

let libsLoaded = false;
let libsLoadPromise: Promise<void> | null = null;

/**
 * 确保 PDF 相关库已加载
 */
async function ensureLibsLoaded(): Promise<void> {
  if (libsLoaded) return;

  if (libsLoadPromise) {
    return libsLoadPromise;
  }

  libsLoadPromise = (async () => {
    await Promise.all([
      loadScriptWithFallback(CDN_RESOURCES.HTML2CANVAS),
      loadScriptWithFallback(CDN_RESOURCES.JSPDF),
      loadScriptWithFallback(CDN_RESOURCES.HTML2PDF),
    ]);
    libsLoaded = true;
  })();

  return libsLoadPromise;
}

// =============================================================================
// 按钮状态管理（消除重复代码）
// =============================================================================

/**
 * 禁用 PDF 按钮并更新文字
 */
function disableButtons(
  state: ButtonState,
  loadingText: string
): void {
  state.pagedBtn.disabled = true;
  state.singleBtn.disabled = true;
  state.pagedBtn.textContent = loadingText;
}

/**
 * 恢复 PDF 按钮状态
 */
function enableButtons(state: ButtonState): void {
  state.pagedBtn.disabled = false;
  state.singleBtn.disabled = false;
  state.pagedBtn.textContent = UI_TEXT.PDF_BUTTONS.PAGED;
  state.singleBtn.textContent = UI_TEXT.PDF_BUTTONS.SINGLE;
}

/**
 * 更新单页按钮文字
 */
function updateSingleButtonText(
  state: ButtonState,
  text: string
): void {
  state.singleBtn.textContent = text;
}

// =============================================================================
// 样式保存与恢复
// =============================================================================

interface SavedStyles {
  contentStyle: string;
  containerStyle: string;
}

/**
 * 保存元素原始样式
 */
function saveStyles(
  contentArea: HTMLElement,
  container: HTMLElement | null
): SavedStyles {
  return {
    contentStyle: contentArea.getAttribute('style') ?? '',
    containerStyle: container?.getAttribute('style') ?? '',
  };
}

/**
 * 恢复元素原始样式
 */
function restoreStyles(
  contentArea: HTMLElement,
  container: HTMLElement | null,
  saved: SavedStyles
): void {
  contentArea.setAttribute('style', saved.contentStyle);
  if (container) {
    container.setAttribute('style', saved.containerStyle);
  }
}

/**
 * 应用 A4 样式到内容区域
 */
function applyA4Styles(contentArea: HTMLElement): void {
  contentArea.style.width = `${A4.CONTENT_WIDTH_PX}px`;
  contentArea.style.margin = '0 auto';
  contentArea.style.padding = '10mm';
}

// =============================================================================
// 分页 PDF 生成
// =============================================================================

/**
 * 生成分页 PDF 的配置选项
 */
function getPagedPdfOptions(): Html2PdfOptions {
  return {
    margin: PDF_CONFIG.PAGED_MARGINS,
    filename: PDF_CONFIG.PAGED_FILENAME,
    image: { type: 'jpeg', quality: PDF_CONFIG.IMAGE_QUALITY },
    enableLinks: true,
    html2canvas: {
      scale: PDF_CONFIG.SCALE,
      useCORS: true,
      logging: false, // 生产环境禁用日志
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
      avoid: [
        'img',
        'svg',
        'canvas',
        'table',
        'tr',
        'th',
        'td',
        'pre',
        'code',
        'blockquote',
        'figure',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'li',
        'dd',
        'dt',
        'br',
        '.avoid-page-break',
      ],
    },
  };
}

/**
 * 为 PDF 添加页码
 */
function addPageNumbers(pdf: JsPDF): void {
  const totalPages = pdf.internal.getNumberOfPages();
  const { R, G, B } = STYLES.COLORS.PAGE_NUMBER;

  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(STYLES.PAGE_NUMBER_FONT_SIZE);
    pdf.setTextColor(R, G, B);
    pdf.text(
      UI_TEXT.PAGE_NUMBER_FORMAT(i, totalPages),
      pdf.internal.pageSize.getWidth() - 60,
      pdf.internal.pageSize.getHeight() - 8
    );
  }
}

/**
 * 生成分页 PDF
 */
export async function generatePagedPdf(
  contentArea: HTMLElement,
  buttonState: ButtonState
): Promise<void> {
  disableButtons(buttonState, UI_TEXT.PDF_BUTTONS.PAGED_LOADING);

  const savedStyles = saveStyles(contentArea, null);

  try {
    await ensureLibsLoaded();

    applyA4Styles(contentArea);

    const html2pdf = (window as unknown as { html2pdf: Html2Pdf }).html2pdf;
    const options = getPagedPdfOptions();

    await new Promise<void>((resolve, reject) => {
      html2pdf()
        .from(contentArea)
        .set(options)
        .toPdf()
        .get('pdf')
        .then((pdf: JsPDF) => {
          addPageNumbers(pdf);
          pdf.save(PDF_CONFIG.PAGED_FILENAME);
          resolve();
        })
        .catch((err: Error) => {
          reject(err);
        });
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('PDF 生成失败:', error);
    alert(`${UI_TEXT.ERRORS.PDF_GENERATION_FAILED}: ${message}`);
  } finally {
    restoreStyles(contentArea, null, savedStyles);
    enableButtons(buttonState);
  }
}

// =============================================================================
// 单页 PDF 生成
// =============================================================================

/**
 * 生成单页 PDF
 */
export async function generateSinglePagePdf(
  contentArea: HTMLElement,
  buttonState: ButtonState
): Promise<void> {
  buttonState.pagedBtn.disabled = true;
  buttonState.singleBtn.disabled = true;
  buttonState.singleBtn.textContent = UI_TEXT.PDF_BUTTONS.SINGLE_RENDERING;

  const container = contentArea.closest('.container') as HTMLElement | null;
  const savedStyles = saveStyles(contentArea, container);

  try {
    await ensureLibsLoaded();

    // 应用样式
    applyA4Styles(contentArea);
    contentArea.style.overflow = 'visible';
    contentArea.style.boxShadow = 'none';

    const html2canvas = (window as unknown as { html2canvas: Html2Canvas })
      .html2canvas;

    const options: Html2CanvasOptions = {
      scale: PDF_CONFIG.SCALE,
      useCORS: true,
      logging: false,
      allowTaint: false,
      backgroundColor: STYLES.COLORS.WHITE,
      letterRendering: true,
      width: A4.CONTENT_WIDTH_PX,
      windowWidth: A4.CONTENT_WIDTH_PX,
      height: contentArea.scrollHeight,
      x: 0,
      y: 0,
    };

    const canvas = await html2canvas(contentArea, options);

    updateSingleButtonText(buttonState, UI_TEXT.PDF_BUTTONS.SINGLE_GENERATING);

    const imgData = canvas.toDataURL('image/jpeg', PDF_CONFIG.IMAGE_QUALITY);
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;

    // 计算 PDF 尺寸
    const pdfWidth = A4.WIDTH_MM;
    const pdfHeight = (imgHeight * pdfWidth) / imgWidth;

    // 获取 jsPDF 构造函数
    const { jsPDF } = window as unknown as { jsPDF: JsPDFConstructor };

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [pdfWidth, pdfHeight],
      compress: true,
    });

    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(PDF_CONFIG.SINGLE_PAGE_FILENAME);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('单页 PDF 生成失败:', error);

    let alertMessage = `${UI_TEXT.ERRORS.PDF_GENERATION_FAILED}: ${message}`;
    if (message.includes('CORS')) {
      alertMessage = UI_TEXT.ERRORS.CORS_ERROR;
    }
    alert(alertMessage);
  } finally {
    restoreStyles(contentArea, container, savedStyles);
    enableButtons(buttonState);
  }
}

// =============================================================================
// 初始化函数
// =============================================================================

/**
 * 预加载 PDF 相关库
 * 可在页面加载时调用，提前加载库以加快后续 PDF 生成
 */
export function preloadPdfLibs(): void {
  ensureLibsLoaded().catch(err => {
    console.error('预加载 PDF 库失败:', err);
  });
}
