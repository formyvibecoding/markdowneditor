export function convertMarkdown(markdownText, markedLib = marked, DOMPurifyLib = DOMPurify) {
  const rawHtml = markedLib.parse(markdownText);
  return DOMPurifyLib.sanitize(rawHtml);
}

export function createMarkdownBlob(markdownText) {
  return new Blob([markdownText], { type: 'text/markdown;charset=utf-8' });
}
