# Changelog

所有重要的变更都会记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [2.0.1] - 2026-01-23

### 修复

- **GitHub Pages 部署问题**：修复从 v2.0.0 升级后页面无法正常显示的问题
  - 问题原因：Vite 项目需要构建步骤，但 GitHub Pages 直接从源代码部署
  - 添加 `base: '/markdowneditor/'` 配置到 vite.config.ts
  - 新增 GitHub Actions 工作流（`.github/workflows/deploy.yml`）实现自动构建和部署

## [2.0.0] - 2026-01-23

### 重大变更

- **架构重构**：迁移至 Vite + TypeScript 现代化架构
- **模块化拆分**：将单一 565 行 script.js 拆分为多个独立模块

### 新增

- **TypeScript 支持**：完整的类型定义和类型检查
- **XSS 防护**：使用 DOMPurify 消毒 HTML，防止跨站脚本攻击
- **CDN 回退机制**：每个外部库支持 3 个 CDN 源自动回退
- **全局错误边界**：捕获未处理的错误和 Promise 拒绝
- **防抖处理**：快捷键添加防抖，避免重复触发
- **ESLint + Prettier**：统一代码风格和质量检查
- **Vitest 单元测试**：工具函数和消毒模块的测试覆盖
- **Playwright E2E 测试**：端到端自动化测试

### 改进

- **PDF 按钮命名统一**：`下载 PDF（分页）` / `下载 PDF（单页）`
- **平台检测现代化**：使用 User-Agent Client Hints API，回退到传统方式
- **内存泄漏修复**：延迟释放 Object URL，确保下载完成
- **移除 console.log**：生产环境不再输出调试日志
- **配置集中管理**：所有常量和配置集中在 config.ts
- **模板抽离**：预览页面 HTML 模板从 JS 中分离

### 技术栈

- Vite 5.x - 构建工具
- TypeScript 5.x - 类型系统
- ESLint 9.x - 代码检查
- Prettier 3.x - 代码格式化
- Vitest 1.x - 单元测试
- Playwright 1.x - E2E 测试
- DOMPurify 3.x - HTML 消毒
- Marked 12.x - Markdown 解析

### 文件结构

```
markdowneditor/
├── src/
│   ├── config.ts        # 配置常量
│   ├── utils.ts         # 工具函数
│   ├── sanitize.ts      # HTML 消毒
│   ├── pdf.ts           # PDF 生成
│   ├── main.ts          # 主入口
│   ├── styles.css       # 样式
│   ├── vite-env.d.ts    # 类型声明
│   └── templates/
│       └── preview.ts   # 预览模板
├── tests/
│   ├── unit/            # 单元测试
│   └── e2e/             # E2E 测试
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
├── playwright.config.ts
├── eslint.config.js
└── .prettierrc
```

## [1.0.1] - 2026-01-23

### 修复

- 修复 PDF 下载功能（分页模式）无法保存文件的问题
  - 问题原因：`.then()` 回调中没有返回 `pdf` 对象，导致后续的 `.save()` 方法接收到 `undefined`
  - 修复位置：`script.js` 第 412 行

## [1.0.0] - 初始版本

### 功能

- Markdown 编辑器基础功能
- 预览功能（新标签页打开）
- Markdown 文件下载
- PDF 下载（分页模式）
- PDF 下载（单页模式）
- 页码显示功能
