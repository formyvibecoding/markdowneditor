/**
 * Markdown 编辑器配置模块
 * 集中管理所有常量和配置
 */

// =============================================================================
// 版本信息
// =============================================================================
export const VERSION = '2.0.0';

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
    SINGLE: '下载 PDF（单页）',
    SINGLE_RENDERING: '正在渲染...',
    SINGLE_GENERATING: '正在生成 PDF...',
  },
  /** 错误提示 */
  ERRORS: {
    EMPTY_CONTENT: '编辑器内容为空，无法下载。',
    POPUP_BLOCKED: '无法打开新标签页，请检查浏览器设置是否阻止了弹出窗口。',
    PDF_GENERATION_FAILED: '生成 PDF 时出错',
    PDF_INIT_FAILED: '初始化 PDF 生成器出错',
    CORS_ERROR: '可能存在跨域图片加载问题，请检查浏览器控制台。',
  },
  /** 页码格式 */
  PAGE_NUMBER_FORMAT: (current: number, total: number): string =>
    `第 ${current} 页 / 共 ${total} 页`,
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
    PDF_BUTTON_PAGED: '#28a745',
    PDF_BUTTON_PAGED_HOVER: '#218838',
    PDF_BUTTON_SINGLE: '#007bff',
    PDF_BUTTON_SINGLE_HOVER: '#0056b3',
  },
  /** 字体 */
  FONTS: {
    BODY: '"Helvetica Neue", Arial, sans-serif',
    EDITOR: '"Courier New", monospace',
    BUTTON: "'Times New Roman', Times, serif",
    PREVIEW:
      '-apple-system, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "微软雅黑", sans-serif',
  },
  /** 页码字体大小 (pt) */
  PAGE_NUMBER_FONT_SIZE: 9,
} as const;

// =============================================================================
// CDN 资源配置（带回退）
// =============================================================================
export const CDN_RESOURCES = {
  /** html2canvas CDN URLs (主 + 备用) */
  HTML2CANVAS: [
    'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
    'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js',
    'https://unpkg.com/html2canvas@1.4.1/dist/html2canvas.min.js',
  ],
  /** jsPDF CDN URLs (主 + 备用) */
  JSPDF: [
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
    'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js',
    'https://unpkg.com/jspdf@2.5.1/dist/jspdf.umd.min.js',
  ],
  /** html2pdf CDN URLs (主 + 备用) */
  HTML2PDF: [
    'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js',
    'https://cdn.jsdelivr.net/npm/html2pdf.js@0.10.1/dist/html2pdf.bundle.min.js',
    'https://unpkg.com/html2pdf.js@0.10.1/dist/html2pdf.bundle.min.js',
  ],
  /** GitHub Markdown CSS */
  GITHUB_MARKDOWN_CSS:
    'https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.1.0/github-markdown-light.min.css',
} as const;

// =============================================================================
// Marked.js 配置
// =============================================================================
export const MARKED_OPTIONS = {
  gfm: true,
  breaks: true,
  pedantic: false,
} as const;

// =============================================================================
// 示例 Markdown 内容
// =============================================================================
export const EXAMPLE_MARKDOWN = `# 一级标题

## 二级标题

### 三级标题

#### 四级标题

##### 五级标题

###### 六级标题

---

**加粗文本**

_斜体文本_

***加粗斜体文本***

~~删除线文本~~

---

这是一个段落，后面跟一个[链接文本](https://example.com)。

这是一个带标题的链接：[Google](https://www.google.com "Google 搜索")

自动链接：<https://www.example.com>

---

### 引用

> 这是一级引用
>> 这是二级引用
>>> 这是三级引用

---

### 列表

#### 无序列表

- 项目一
- 项目二
  - 子项目一
    - 子子项目

* 星号也可以用来创建列表
+ 加号也可以

#### 有序列表

1. 第一项
2. 第二项
   1. 子项一
   2. 子项二

---

### 任务列表

- [x] 已完成任务
- [ ] 未完成任务
  - [x] 子任务一
  - [ ] 子任务二

---

### 代码

#### 行内代码

这是 \`行内代码\` 的示例。

#### 代码块

\`\`\`python
def hello():
    print("Hello, Markdown!")
\`\`\`

或使用缩进方式：

    def hello():
        print("Hello, Markdown!")

---

### 表格

| 姓名 | 年龄 | 城市     |
|------|------|----------|
| 张三 | 25   | 北京     |
| 李四 | 30   | 上海     |
| 王五 | 28   | 广州     |

---

### 图片

![示例图片](https://www.mirabot.co.jp/application/themes/collabot/assets/img/top/logo.png)

---

### 水平线

---

***

___

---

### HTML 混用

<p style="color:red">这是一段红色文本（HTML 插入）</p>

---

### 脚注

这是一个带脚注的示例[^1]。

[^1]: 这里是脚注内容。
`;
