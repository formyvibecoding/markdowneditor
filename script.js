import { convertMarkdown, createMarkdownBlob } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
  const markdownInput = document.getElementById('markdown-input');
  const previewNewTabBtn = document.getElementById('preview-new-tab-btn');
  const downloadMarkdownBtn = document.getElementById('download-markdown-btn');

  fetch('example.md')
    .then(res => res.text())
    .then(text => { markdownInput.value = text; })
    .catch(() => { markdownInput.value = ''; });

  marked.setOptions({
    gfm: true,
    breaks: true,
    pedantic: false,
    smartLists: true,
    smartypants: false
  });

  previewNewTabBtn.addEventListener('click', async () => {
    const markdownText = markdownInput.value;
    const safeHtml = convertMarkdown(markdownText);
    try {
      const template = await fetch('preview.html').then(r => r.text());
      const htmlContent = template.replace('<!--CONTENT_PLACEHOLDER-->', safeHtml);
      const previewWindow = window.open('', '_blank');
      if (previewWindow) {
        previewWindow.document.open();
        previewWindow.document.write(htmlContent);
        previewWindow.document.close();
        previewWindow.focus();
      } else {
        alert('无法打开新标签页，请检查浏览器设置是否阻止了弹出窗口。');
      }
    } catch (err) {
      alert('加载预览模板失败: ' + err);
    }
  });

  downloadMarkdownBtn.addEventListener('click', () => {
    const markdownText = markdownInput.value;
    const blob = createMarkdownBlob(markdownText);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const fileName = new Date().toISOString().replace(/[^\d]/g, '').slice(0,14) + '.md';
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  });

  document.addEventListener('keydown', function(event) {
    if (event.metaKey && event.key === 'Enter') {
      event.preventDefault();
      downloadMarkdownBtn.click();
    } else if (!navigator.platform.includes('Mac') && event.ctrlKey && event.key === 'Enter') {
      event.preventDefault();
      downloadMarkdownBtn.click();
    }
  });
});
