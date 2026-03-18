/**
 * Markdown 编辑器配置模块
 * 集中管理所有常量和配置
 */

// =============================================================================
// 版本信息
// =============================================================================
export const VERSION = '2.9.0';

// =============================================================================
// A4 尺寸常量
// =============================================================================
export const A4 = {
  /** A4 宽度 (mm) */
  WIDTH_MM: 210,
  /** A4 高度 (mm) */
  HEIGHT_MM: 297,
  /** A4 宽度 (px @ 96dpi) */
  WIDTH_PX: 794,
  /** A4 高度 (px @ 96dpi) */
  HEIGHT_PX: 1123,
  /** 考虑页边距后的内容宽度 (px) */
  CONTENT_WIDTH_PX: 734,
} as const;

// =============================================================================
// PDF 生成配置
// =============================================================================
export const PDF_CONFIG = {
  /** 分页 PDF 边距 [上, 右, 下, 左] (mm) */
  PAGED_MARGINS: [10, 10, 15, 10] as const,
  /** 图片质量 (0-1) */
  IMAGE_QUALITY: 0.98,
  /** 渲染缩放比例 */
  SCALE: 2,
  /** 分页 PDF 文件名 */
  PAGED_FILENAME: 'markdown-preview-paged.pdf',
  /** 单页 PDF 文件名 */
  SINGLE_PAGE_FILENAME: 'markdown-preview-single-page.pdf',
} as const;

// =============================================================================
// UI 文案配置
// =============================================================================
export const UI_TEXT = {
  /** PDF 按钮文案 */
  PDF_BUTTONS: {
    PAGED: '下载 PDF（分页）',
    PAGED_LOADING: '正在生成...',
    SINGLE: '保存 PDF（单页）',
    SINGLE_PREPARING: '正在准备打印...',
  },
  /** 预览复制按钮文案 */
  COPY_BUTTONS: {
    COPY: '复制预览',
    COPYING: '正在复制...',
    COPIED: '已复制',
  },
  /** 长图按钮文案 */
  LONG_IMAGE_BUTTONS: {
    DEFAULT: '导出长图',
    RENDERING: '正在渲染...',
    GENERATING: '正在生成图片...',
  },
  /** 错误提示 */
  ERRORS: {
    EMPTY_CONTENT: '编辑器内容为空，无法下载。',
    EMPTY_CONTENT_PREVIEW: '请先输入内容，再进行预览。',
    POPUP_BLOCKED: '无法打开新标签页，请检查浏览器设置是否阻止了弹出窗口。',
    PDF_GENERATION_FAILED: '生成 PDF 时出错',
    PDF_INIT_FAILED: '初始化 PDF 生成器出错',
    CORS_ERROR: '可能存在跨域图片加载问题，请检查浏览器控制台。',
    COPY_FAILED: '复制失败，请检查浏览器权限后重试。',
  },
  /** 页码格式 */
  PAGE_NUMBER_FORMAT: (current: number, total: number): string =>
    `${current} / ${total}`,
} as const;

// =============================================================================
// 样式配置
// =============================================================================
export const STYLES = {
  /** 颜色 */
  COLORS: {
    BACKGROUND: '#f5f5f5',
    TEXT: '#333',
    HEADING: '#2c3e50',
    BUTTON_TEXT: '#5c3e2e',
    WHITE: '#ffffff',
    PAGE_NUMBER: { R: 128, G: 128, B: 128 },
  },
  /** 字体 */
  FONTS: {
    BODY: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Noto Sans SC", "Microsoft YaHei", "微软雅黑", sans-serif',
    EDITOR: '"Courier New", monospace',
    BUTTON:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Noto Sans SC", "Microsoft YaHei", "微软雅黑", sans-serif',
    PREVIEW:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Noto Sans SC", "Microsoft YaHei", "微软雅黑", sans-serif',
  },
  /** 页码字体大小 (pt) */
  PAGE_NUMBER_FONT_SIZE: 9,
} as const;

// =============================================================================
// Vendor 资源配置（本地打包，不依赖外部 CDN）
// =============================================================================
const BASE = import.meta.env.BASE_URL;

export const VENDOR_RESOURCES = {
  /** html2canvas 本地路径 */
  HTML2CANVAS: [`${BASE}vendor/html2canvas.min.js`],
  /** jsPDF 本地路径 */
  JSPDF: [`${BASE}vendor/jspdf.umd.min.js`],
  /** html2pdf 本地路径 */
  HTML2PDF: [`${BASE}vendor/html2pdf.bundle.min.js`],
  /** GitHub Markdown CSS */
  GITHUB_MARKDOWN_CSS:
    'https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.1.0/github-markdown-light.min.css',
} as const;

// =============================================================================
// 长图导出配置
// =============================================================================
export const LONG_IMAGE = {
  /** 模拟手机宽度 (px) — iPhone 14/15 标准 */
  WIDTH_PX: 390,
  /** 渲染缩放比例 */
  SCALE: 3,
  /** 内容内边距 (px) */
  PADDING: 24,
  /** 头部标题区域内边距 (px) */
  HEADER_PADDING: 24,
  /** 底部水印区域内边距 (px) */
  FOOTER_PADDING: 16,
  /** 水印文案 */
  WATERMARK_TEXT: 'Made with Markdown Editor',
  /** 文件名前缀 */
  FILENAME_PREFIX: 'markdown-long-image',
} as const;

// =============================================================================
// Marked.js 配置
// =============================================================================
export const MARKED_OPTIONS = {
  gfm: true,
  breaks: true,
  pedantic: false,
} as const;

