# Markdown编辑器项目组件文档 (PCD)

## 项目概述

这是一个简洁高效的Markdown编辑器，提供实时编辑和预览功能。编辑器采用极简设计，专注于提供流畅的写作体验。预览功能在新标签页中打开，支持高质量PDF导出（分页或单页模式）。同时提供快捷下载原始Markdown内容的功能。

**当前版本**: 2.2.1

## 技术架构

### 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Vite | 5.x | 构建工具、开发服务器 |
| TypeScript | 5.x | 类型系统 |
| ESLint | 9.x | 代码质量检查 |
| Prettier | 3.x | 代码格式化 |
| Vitest | 1.x | 单元测试 |
| Playwright | 1.x | E2E 测试 |
| DOMPurify | 3.x | HTML 消毒（XSS 防护） |
| Marked | 12.x | Markdown 解析 |

### 项目结构

```
markdowneditor/
├── src/                      # 源代码
│   ├── config.ts            # 配置常量（A4 尺寸、颜色、CDN 地址等）
│   ├── utils.ts             # 工具函数（防抖、平台检测、文件下载等）
│   ├── sanitize.ts          # HTML 消毒（XSS 防护，保留安全样式）
│   ├── pdf.ts               # PDF 生成逻辑
│   ├── main.ts              # 应用主入口
│   ├── styles.css           # 样式文件
│   ├── vite-env.d.ts        # Vite 环境类型声明
│   └── templates/
│       └── preview.ts       # 预览页面模板
├── tests/
│   ├── unit/                # 单元测试
│   │   ├── utils.test.ts
│   │   └── sanitize.test.ts
│   └── e2e/                 # E2E 测试
│       └── editor.spec.ts
├── index.html               # HTML 入口
├── package.json             # 项目配置
├── tsconfig.json            # TypeScript 配置
├── vite.config.ts           # Vite 配置
├── vitest.config.ts         # Vitest 配置
├── playwright.config.ts     # Playwright 配置
├── eslint.config.js         # ESLint 配置
├── .prettierrc              # Prettier 配置
├── .gitignore               # Git 忽略文件
├── CHANGELOG.md             # 版本变更日志
└── PCD.md                   # 项目文档（本文件）
```

## 模块详解

### 1. 配置模块 (config.ts)

集中管理所有配置常量：

- **VERSION**: 当前版本号
- **A4**: A4 纸张尺寸常量（mm 和 px）
- **PDF_CONFIG**: PDF 生成配置（边距、质量、文件名等）
- **UI_TEXT**: UI 文案（按钮文字、错误提示等）
- **STYLES**: 样式配置（颜色、字体等）
- **CDN_RESOURCES**: CDN 地址（支持多源回退）
- **MARKED_OPTIONS**: Marked.js 配置
- **EXAMPLE_MARKDOWN**: 示例 Markdown 内容

### 2. 工具模块 (utils.ts)

通用工具函数：

- **debounce**: 防抖函数，避免快速连续触发
- **getPlatformInfo**: 平台检测（使用现代 API，回退传统方式）
- **downloadFile**: 文件下载（修复内存泄漏）
- **generateTimestampFilename**: 生成时间戳文件名
- **loadScriptWithFallback**: CDN 加载（支持多源回退）
- **safeExecute**: 安全执行异步函数
- **requireElement**: 必须获取 DOM 元素

### 3. 消毒模块 (sanitize.ts)

使用 DOMPurify 防止 XSS 攻击，同时保留安全的 HTML 样式：

**允许的标签**：
- 文本格式：p, br, hr, span, div, pre, code, blockquote
- 标题：h1-h6
- 列表：ul, ol, li, dl, dt, dd
- 表格：table, thead, tbody, tr, th, td
- 文本修饰：strong, b, em, i, u, s, del, ins, mark
- 链接媒体：a, img, figure

**允许的 CSS 属性**：
- 颜色：color, background-color
- 文本：font-family, font-size, text-align
- 边框：border, border-radius
- 间距：margin, padding
- 尺寸：width, height

**安全处理**：
- 外部链接自动添加 `target="_blank" rel="noopener noreferrer"`
- 图片自动添加 `loading="lazy"`

### 4. PDF 模块 (pdf.ts)

处理分页和单页 PDF 的生成：

- CDN 库懒加载，支持多源回退
- 统一的按钮状态管理（消除重复代码）
- 样式保存与恢复机制
- 分页 PDF 自动添加页码

### 5. 预览模板 (templates/preview.ts)

将 HTML 模板从主逻辑中抽离：

- CSS 样式模板
- JavaScript 逻辑模板
- 统一的按钮命名

### 6. 主入口 (main.ts)

应用初始化和主逻辑：

- 全局错误边界
- Marked.js 配置
- 快捷键设置（带防抖）
- 下载和预览功能绑定

## 功能特性

### 核心功能

1. **Markdown 编辑**
   - 等宽字体编辑区域
   - 示例内容预填充
   - 支持所有 GFM 语法

2. **预览功能**
   - 新标签页打开
   - GitHub 风格样式
   - HTML 消毒（防 XSS）
   - 预览内容复制（带样式）

3. **下载功能**
   - Markdown 文件下载
   - 时间戳命名
   - 快捷键支持（Cmd/Ctrl + Enter）

4. **PDF 导出**
   - 分页模式（适合长文档）
   - 单页模式（适合短文档）
   - 自动页码
   - 高质量渲染（2x 缩放）

5. **项目入口**
   - 页脚 GitHub 图标快捷入口

### 安全特性

1. **XSS 防护**
   - DOMPurify 消毒所有 HTML
   - 白名单机制（只允许安全标签/属性）
   - CSS 属性过滤

2. **错误边界**
   - 全局错误捕获
   - Promise 拒绝捕获
   - 用户友好的错误提示

3. **CDN 回退**
   - 每个库 3 个 CDN 源
   - 自动失败切换

## 开发指南

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 代码检查

```bash
npm run lint        # 检查
npm run lint:fix    # 自动修复
npm run format      # 格式化
```

### 运行测试

```bash
npm run test           # 单元测试
npm run test:coverage  # 覆盖率报告
npm run test:e2e       # E2E 测试
```

### 类型检查

```bash
npm run typecheck
```

## 设计原则

1. **极简设计**
   - 无冗余 UI 元素
   - 专注于内容创作
   - 居中布局

2. **古典风格**
   - 传统设计语言
   - 优雅的文字效果
   - 轻柔阴影

3. **响应式布局**
   - 适应不同屏幕
   - 移动设备优化

4. **安全第一**
   - 默认消毒所有用户输入
   - 允许安全的样式自定义

## 版本历史

详见 [CHANGELOG.md](./CHANGELOG.md)

---

## 需求更新记录（PRD）

### 版本 2.1.0

**功能描述**
- 新增英文 README，完善 GitHub 展示信息与使用说明。
- 预览页新增“复制预览”按钮，一键复制带样式的预览内容。
- 页面页脚新增 GitHub 项目图标入口。

**用户故事**
- 作为访客，我希望在 GitHub 上快速了解项目功能、用法与贡献方式。
- 作为作者，我希望一键复制预览内容到富文本编辑器并保持样式。
- 作为新用户，我希望在页面底部快速跳转到 GitHub 仓库。

**设计稿链接**
- 沿用当前界面风格，暂无独立设计稿（N/A）。

**技术方案**
- 在 `index.html` 中添加页脚 GitHub 图标链接，并在 `styles.css` 中补充样式布局。
- 在预览模板中新增复制按钮，通过选区复制模拟用户 Cmd/Ctrl+C 的富文本复制行为。
- 新增英文 README 文档，补齐功能说明与贡献指南。

**测试用例**
- 点击页脚 GitHub 图标可跳转到指定仓库链接。
- 预览页点击“复制预览”后粘贴到富文本编辑器，样式与内容保持一致。
- README 结构完整，包含功能、演示、安装、使用、贡献与许可证说明。

---

*文档更新日期：2026-01-24*

---

### 版本 2.2.0

**功能描述**
- 预览页新增任务列表复选框渲染，支持 `- [ ]`、`- [x]`、`- [X]`，并允许用户在预览中交互勾选。

**用户故事**
- 作为作者，我希望在预览页直接看到任务列表的勾选状态，并可临时勾选以核对完成情况。

**设计稿链接**
- 沿用当前界面风格，暂无独立设计稿（N/A）。

**技术方案**
- 在 Marked 渲染器中覆盖 checkbox 输出，移除默认禁用状态，允许交互勾选。
- 更新 HTML 消毒白名单，允许 `input` 标签及其安全属性。

**测试用例**
- 预览页中 `- [ ]` 渲染为空的复选框且可点击。
- 预览页中 `- [x]` / `- [X]` 渲染为已勾选复选框且可点击切换。
- 消毒后复选框结构仍保留，且无脚本注入风险。

*文档更新日期：2026-01-25*

---

### 版本 2.2.1

**功能描述**
- 复制预览内容时同步复选框勾选状态，确保粘贴到 Jira 等富文本编辑器时保留任务列表状态。

**用户故事**
- 作为作者，我希望在预览页勾选任务后复制到富文本编辑器时，勾选状态能被保留。

**设计稿链接**
- 沿用当前界面风格，暂无独立设计稿（N/A）。

**技术方案**
- 复制预览内容时对复选框的 `checked` 属性进行同步，并优先使用 Clipboard API 写入 HTML。

**测试用例**
- 勾选预览页任务列表后复制，粘贴到 Jira 富文本编辑器时仍保留勾选状态。
- 未勾选任务复制后粘贴，仍显示为空复选框。

*文档更新日期：2026-01-26*
