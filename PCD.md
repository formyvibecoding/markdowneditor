# Markdown编辑器项目组件文档 (PCD)

## 项目概述

这是一个简洁高效的Markdown编辑器，提供实时编辑和预览功能。编辑器采用极简设计，专注于提供流畅的写作体验。预览功能在新标签页中打开，支持高质量PDF导出（分页或单页模式）。同时提供快捷下载原始Markdown内容的功能。

## 组件结构

项目由三个主要文件组成:

1. **index.html**: 主页面结构，包含编辑器界面
2. **styles.css**: 样式定义，负责编辑器的视觉效果和布局
3. **script.js**: 功能实现，处理编辑器的行为和预览转换

### 文件关系图

```
Markdown编辑器
├── index.html (主页面)
├── styles.css (样式)
├── script.js (功能)
└── PCD.md (项目文档)
```

## 组件详解

### 1. 编辑器组件 (index.html)

主要结构包括：
- 整体容器（.container）
- 控制面板（.control-panel）
- 编辑器容器（.editor-container）
- 编辑区域（#markdown-input）

```html
<div class="container">
    <div class="control-panel">
        <button id="preview-new-tab-btn" class="control-btn">预览</button>
        <button id="download-markdown-btn" class="control-btn">下载</button>
    </div>
    <div class="editor-container single-pane">
        <div class="editor-wrapper full-width">
            <div class="editor-content">
                <textarea id="markdown-input" placeholder="在这里输入 Markdown 内容..."></textarea>
            </div>
        </div>
    </div>
</div>
```

### 2. 样式组件 (styles.css)

主要样式区域：
- 全局样式：基础设置，包括字体、颜色等
- 布局样式：编辑器位置和尺寸（居中正方形布局）
- 控制元素样式：古典文字按钮设计，带有柔和文本阴影
- 编辑器阴影效果：轻微的阴影提升视觉层次感
- 响应式设计：适配不同屏幕尺寸

### 3. 功能组件 (script.js)

主要功能模块：
- Markdown转换：使用marked.js库将Markdown转为HTML
- 预览功能：在新标签页打开预览
- Markdown下载：将编辑内容保存为时间戳命名的.md文件
- PDF导出：支持两种模式
  - 分页PDF：适合长文档，自动分页
  - 单页PDF：适合短文档，保持内容完整性

## 技术栈

- **前端框架**：原生HTML/CSS/JavaScript
- **Markdown解析**：marked.js
- **PDF生成**：
  - html2pdf.js：用于分页PDF生成
  - html2canvas：用于单页PDF渲染
  - jsPDF：PDF文件创建
- **文件处理**：Blob API和URL对象用于文件下载

## 设计特点

1. **极简设计**：
   - 无冗余UI元素
   - 专注于内容创作
   - 居中布局提供最佳写作体验

2. **古典风格**：
   - 控制按钮采用传统设计语言
   - 优雅的文字效果和轻柔阴影
   - 注重细节的互动反馈

3. **响应式布局**：
   - 适应不同屏幕尺寸
   - 在移动设备上优化显示

4. **视觉层次**：
   - 柔和的阴影效果提升界面质感
   - 按钮文字阴影增强可读性
   - 编辑区优雅的浮动效果

## 使用说明

1. 在编辑区域输入Markdown内容
2. 点击"预览"在新标签页查看渲染效果
3. 点击"下载"将当前Markdown内容保存为本地文件（文件名为当前时间戳）
4. 在预览页面可下载PDF:
   - "下载PDF(分页)"：生成多页PDF，适合长文档
   - "下载为1页PDF"：生成单页PDF，适合短文档

## PDF生成特性

### 分页PDF特性
- 智能分页：避免元素被切断
- 页码显示：自动添加页码
- A4尺寸：标准文档格式
- 优化的中英文混排：修复字体间距问题

### 单页PDF特性
- 固定A4宽度：保证排版一致性
- 高质量渲染：2倍缩放，清晰显示
- 保持内容完整性：不分隔内容
- 优化的字体渲染：解决中英文混排问题

## 最近更新

1. **添加了Markdown下载功能**：
   - 一键保存当前编辑内容为本地.md文件
   - 文件名采用时间戳格式（YYYYMMDDHHmmss.md）
   - 使用Web API实现无服务器下载

2. **优化了界面视觉效果**：
   - 添加了优雅的阴影效果增强视觉层次
   - 为按钮文字添加柔和阴影
   - 编辑器容器添加轻微阴影效果

3. **修复了PDF预览的文字排版问题**：
   - 解决了中英文混排时的字间距异常
   - 优化了字体族设置，提高跨平台一致性
   - 添加了针对标题元素的特殊处理

## 未来改进方向

1. 添加更多Markdown格式化工具
2. 实现内容自动保存功能
3. 添加主题切换选项
4. 支持图片上传和管理
5. 添加导出更多格式的选项（如HTML、Word等）

---

*文档更新日期：2025-04-15*