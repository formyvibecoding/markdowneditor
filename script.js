document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const markdownInput = document.getElementById('markdown-input');
    const previewNewTabBtn = document.getElementById('preview-new-tab-btn');
    const downloadMarkdownBtn = document.getElementById('download-markdown-btn');
    // const previewContent = document.getElementById('preview-content'); // 预览容器不再需要
    
    // 添加快捷键监听 - 仅使用Command+Enter (Mac)
    document.addEventListener('keydown', function(event) {
        // 检测是否为Mac系统上的Command+Enter
        if (event.metaKey && event.key === 'Enter') {
            event.preventDefault(); // 阻止默认行为
            downloadMarkdownBtn.click(); // 模拟点击下载按钮
        }
        // 在Windows/Linux上使用Control+Enter
        else if (!navigator.platform.includes('Mac') && event.ctrlKey && event.key === 'Enter') {
            event.preventDefault();
            downloadMarkdownBtn.click();
        }
    });
    
    // 配置 Marked.js
    marked.setOptions({
        gfm: true, // 启用 GitHub Flavored Markdown
        breaks: true, // 将换行符渲染为 <br>
        pedantic: false,
        smartLists: true,
        smartypants: false
    });

    // 初始内容 (来自 example.md)
    markdownInput.value = `# 一级标题

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

    // 下载Markdown文件
    downloadMarkdownBtn.addEventListener('click', function() {
        const markdownText = markdownInput.value;
        if (!markdownText.trim()) {
            alert('编辑器内容为空，无法下载。');
            return;
        }

        // 创建当前日期时间格式的文件名 (YYYYMMDDHHmmss)
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const fileName = `${year}${month}${day}${hours}${minutes}${seconds}.md`;

        // 创建Blob对象
        const blob = new Blob([markdownText], { type: 'text/markdown;charset=utf-8' });
        
        // 创建下载链接
        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(blob);
        downloadLink.download = fileName;
        
        // 添加到DOM，触发点击，然后移除
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        // 释放URL对象
        URL.revokeObjectURL(downloadLink.href);
        
        console.log(`Markdown 已下载为 ${fileName}`);
    });

    // 点击按钮在新标签页打开预览
    previewNewTabBtn.addEventListener('click', function() {
        const markdownText = markdownInput.value;
        const htmlContent = marked.parse(markdownText);

        // 创建预览页面的完整 HTML
        const previewHtml = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>Markdown 预览</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.1.0/github-markdown-light.min.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js" integrity="sha512-BNaRQnYJYiPSqHHDb58B0yaPfCu+Wgds8Gp/gU33kqBtgNS4tSPHuGibyoeqMV/TJlSKda6FXzoEyYGjTe+vXA==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
    <!-- 单独引入 jsPDF -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js" integrity="sha512-qZvrmS2ekKPF2mSznTQsxqPgnpkI4DNTlrdUmTzrDgektczlKNRRhy5X5AAOnx5S09ydFYWWNSfcEqDTTHgtNA==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js" integrity="sha512-GsLlZN/3F2ErC5ifS5QtgpiJtWd43JWSuIgh7mbzZ8zBps+dvLusV+eNQATqgA/HdeKFVgA5v3S/cIrLF7QnIg==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
    <style>
        body {
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
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
        #download-pdf-btn {
            background-color: #28a745;
        }
        #download-pdf-btn:hover {
            background-color: #218838;
        }
        #download-single-page-pdf-btn {
            background-color: #007bff;
        }
        #download-single-page-pdf-btn:hover {
            background-color: #0056b3;
        }
        .container {
            max-width: 100%;
            margin: 0 auto;
            padding: 20px;
            padding-top: 70px;
        }
        .markdown-body {
            box-sizing: border-box;
            background-color: #fff;
            padding: 30px;
            margin: 0 auto;
            /* 默认是响应式宽度，PDF生成时会被重写 */
            width: 90%;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            font-family: -apple-system, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "微软雅黑", sans-serif;
            text-align: left;
        }
        /* 为分页准备的样式 */
        @media print {
            /* 避免页面中断 */
            h1, h2, h3, h4, h5, h6, 
            img, table, pre, figure, blockquote, 
            ul, ol, dl {
                break-inside: avoid-page;
                page-break-inside: avoid;
            }
            /* 在特定元素之后分页 */
            h1, h2 {
                break-after: avoid-page;
                page-break-after: avoid;
            }
            /* 在特定元素之前分页 */
            h1 {
                break-before: page;
                page-break-before: page;
            }
        }
        /* 表格标题样式 */
        .markdown-body table th {
            background-color: #e9ecef;
            font-weight: 600;
        }
        /* 移除任何标题的特殊字间距设置 */
        .markdown-body h1, 
        .markdown-body h2, 
        .markdown-body h3, 
        .markdown-body h4, 
        .markdown-body h5, 
        .markdown-body h6 {
            letter-spacing: normal;
            font-family: -apple-system, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "微软雅黑", sans-serif;
            word-spacing: normal;
        }
        
        /* 防止中英文之间的异常间距 */
        .markdown-body * {
            word-break: normal;
            overflow-wrap: break-word;
        }
    </style>
</head>
<body>
    <div class="preview-controls">
        <button id="download-pdf-btn" class="pdf-btn">下载 PDF (分页)</button>
        <button id="download-single-page-pdf-btn" class="pdf-btn">下载为 1 页 PDF</button>
    </div>
    <div class="container">
        <article class="markdown-body" id="preview-content-area">
            ${htmlContent}
        </article>
    </div>

    <script>
        // Common elements
        const contentArea = document.getElementById('preview-content-area');
        const defaultDownloadBtn = document.getElementById('download-pdf-btn');
        const singlePageDownloadBtn = document.getElementById('download-single-page-pdf-btn');
        
        // A4 尺寸常量 (mm)
        const A4_WIDTH_MM = 210;
        const A4_HEIGHT_MM = 297;
        // A4 尺寸常量 (px @ 96dpi)
        const A4_WIDTH_PX = 794; // ≈ 210mm @ 96dpi
        const A4_HEIGHT_PX = 1123; // ≈ 297mm @ 96dpi
        // 考虑页边距后的宽度
        const A4_CONTENT_WIDTH_PX = 734; // 留30px左右边距
        
        // --- 分页PDF下载逻辑 ---
        defaultDownloadBtn.addEventListener('click', () => {
            console.log('Multi-page download button clicked');
            
            // 禁用按钮
            defaultDownloadBtn.disabled = true;
            defaultDownloadBtn.textContent = '正在生成...';
            singlePageDownloadBtn.disabled = true;
            
            try {
                // 保存原始状态
                const originalStyle = contentArea.getAttribute('style') || '';
                
                // 优化：临时将内容设为A4宽度，使得排版更接近PDF
                contentArea.style.width = A4_CONTENT_WIDTH_PX + 'px';
                contentArea.style.margin = '0 auto';
                contentArea.style.padding = '10mm';
                
                // 更先进的分页配置
                const opt = {
                    margin: [10, 10, 15, 10], // 上左下右边距 (mm)
                    filename: 'markdown-preview-paged.pdf',
                    image: { type: 'jpeg', quality: 0.98 },
                    enableLinks: true,
                    html2canvas: { 
                        scale: 2, // 更高分辨率
                        useCORS: true,
                        logging: true,
                        letterRendering: true, // 提高文字渲染质量
                        allowTaint: false, // 安全模式
                    },
                    jsPDF: { 
                        unit: 'mm',
                        format: 'a4',
                        orientation: 'portrait',
                        compress: true
                    },
                    // 增强分页控制
                    pagebreak: {
                        mode: ['avoid-all', 'css', 'legacy'],
                        before: '.page-break-before',
                        after: '.page-break-after',
                        // 避免以下元素内部分页
                        avoid: [
                            'img', 'svg', 'canvas', 'table', 'tr', 'th', 'td',
                            'pre', 'code', 'blockquote', 'figure',
                            'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                            'li', 'dd', 'dt', 'br',
                            '.avoid-page-break'
                        ]
                    }
                };
                
                html2pdf()
                    .from(contentArea)
                    .set(opt)
                    .toPdf() // 创建PDF实例
                    .get('pdf') // 获取内部jsPDF实例
                    .then((pdf) => {
                        // 可以在这里处理jsPDF实例，如添加页码等...
                        const totalPages = pdf.internal.getNumberOfPages();
                        
                        // 添加页码
                        for (let i = 1; i <= totalPages; i++) {
                            pdf.setPage(i);
                            pdf.setFontSize(9);
                            pdf.setTextColor(128, 128, 128);
                            pdf.text(
                                '页码: ' + i + ' / ' + totalPages,
                                pdf.internal.pageSize.getWidth() - 60, // 右对齐位置
                                pdf.internal.pageSize.getHeight() - 8  // 底部位置
                            );
                        }
                    })
                    .save() // 保存PDF
                    .then(() => {
                        console.log('Multi-page PDF generation finished');
                    })
                    .catch(err => {
                        console.error('Error generating multi-page PDF:', err);
                        alert('生成分页 PDF 时出错: ' + err);
                    })
                    .finally(() => {
                        // 恢复原始样式
                        contentArea.setAttribute('style', originalStyle);
                        
                        // 恢复按钮状态
                        defaultDownloadBtn.disabled = false;
                        defaultDownloadBtn.textContent = '下载 PDF (分页)';
                        singlePageDownloadBtn.disabled = false;
                    });
            } catch (err) {
                console.error('Error initializing PDF generation:', err);
                alert('初始化 PDF 生成器出错: ' + err);
                
                // 恢复按钮状态
                defaultDownloadBtn.disabled = false;
                defaultDownloadBtn.textContent = '下载 PDF (分页)';
                singlePageDownloadBtn.disabled = false;
            }
        });

        // --- 单页PDF下载逻辑 ---
        singlePageDownloadBtn.addEventListener('click', () => {
            console.log('Single-page download button clicked');
            
            // 禁用按钮
            singlePageDownloadBtn.disabled = true;
            singlePageDownloadBtn.textContent = '正在渲染...';
            defaultDownloadBtn.disabled = true;
            
            try {
                // 保存原始状态
                const originalStyle = contentArea.getAttribute('style') || '';
                const containerStyle = document.querySelector('.container').getAttribute('style') || '';
                
                // 临时设置样式以确保宽度固定为A4等效宽度
                contentArea.style.width = A4_CONTENT_WIDTH_PX + 'px';
                contentArea.style.margin = '0 auto';
                contentArea.style.padding = '10mm';
                contentArea.style.overflow = 'visible';
                contentArea.style.boxShadow = 'none';
                
                // 配置html2canvas
                const options = {
                    scale: 2, // 更高分辨率
                    useCORS: true, // 尝试加载跨域图片
                    logging: true, // 启用日志
                    allowTaint: false, // 安全模式
                    backgroundColor: '#ffffff',
                    letterRendering: true, // 提高文字渲染质量
                    width: A4_CONTENT_WIDTH_PX, // 强制使用A4内容宽度
                    windowWidth: A4_CONTENT_WIDTH_PX, // 设置窗口宽度为A4宽度
                    height: contentArea.scrollHeight, // 内容高度自适应
                    x: 0,
                    y: 0
                };

                html2canvas(contentArea, options)
                    .then(canvas => {
                        console.log('Canvas generated: ' + canvas.width + 'x' + canvas.height);
                        singlePageDownloadBtn.textContent = '正在生成PDF...';
                        
                        const imgData = canvas.toDataURL('image/jpeg', 0.98);
                        const imgWidth = canvas.width;
                        const imgHeight = canvas.height;
                        
                        // 使用A4宽度(210mm)，计算等比例高度
                        const pdfWidth = A4_WIDTH_MM;
                        const pdfHeight = (imgHeight * pdfWidth) / imgWidth;
                        
                        // 获取正确的jsPDF构造函数
                        const { jsPDF } = window.jspdf;
                        
                        // 创建PDF，使用自定义高度
                        const pdf = new jsPDF({
                            orientation: 'portrait',
                            unit: 'mm',
                            format: [pdfWidth, pdfHeight], // 自定义大小，保持内容比例
                            compress: true // 减小文件体积
                        });
                        
                        // 添加图像到PDF
                        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
                        
                        // 保存PDF文件
                        pdf.save('markdown-preview-single-page.pdf');
                        console.log('Single-page PDF saved - Size: ' + pdfWidth + 'mm x ' + pdfHeight + 'mm');
                    })
                    .catch(err => {
                        console.error('Error during canvas rendering:', err);
                        let alertMsg = '生成单页 PDF 时出错。请检查浏览器控制台获取详细信息。';
                        if (err && err.message && err.message.includes('CORS')) {
                            alertMsg = '生成单页 PDF 时出错：可能存在跨域图片加载问题。请检查浏览器控制台。';
                        } else if (err) {
                            alertMsg = '生成单页 PDF 时出错: ' + err;
                        }
                        alert(alertMsg);
                    })
                    .finally(() => {
                        // 恢复原始样式
                        contentArea.setAttribute('style', originalStyle);
                        document.querySelector('.container').setAttribute('style', containerStyle);
                        
                        // 恢复按钮状态
                        singlePageDownloadBtn.disabled = false;
                        singlePageDownloadBtn.textContent = '下载为 1 页 PDF';
                        defaultDownloadBtn.disabled = false;
                    });
            } catch (err) {
                console.error('Error in single-page PDF preparation:', err);
                alert('准备生成单页 PDF 时出错: ' + err);
                
                // 恢复按钮状态
                singlePageDownloadBtn.disabled = false;
                singlePageDownloadBtn.textContent = '下载为 1 页 PDF';
                defaultDownloadBtn.disabled = false;
            }
        });
    </script>
</body>
</html>
        `;

        // 在新标签页中打开 HTML 内容
        const previewWindow = window.open('', '_blank');
        if (previewWindow) {
            previewWindow.document.open();
            previewWindow.document.write(previewHtml);
            previewWindow.document.close();
            previewWindow.focus();
        } else {
            alert('无法打开新标签页，请检查浏览器设置是否阻止了弹出窗口。');
        }
    });

    // 移除实时更新预览逻辑
    // function updatePreview() { ... }
    // markdownInput.addEventListener('input', function() { ... });
    // 初始化时不再需要更新预览
    // updatePreview();
}); 