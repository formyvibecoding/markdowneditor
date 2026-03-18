import { marked } from 'marked';
import { MARKED_OPTIONS } from './config';
import { sanitizeHtml } from './sanitize';

let markedConfigured = false;

function configureMarked(): void {
  if (markedConfigured) {
    return;
  }

  const renderer = new marked.Renderer();

  renderer.checkbox = (checked: boolean): string => {
    const checkedAttr = checked ? ' checked' : '';
    return `<input class="task-list-item-checkbox" type="checkbox"${checkedAttr}>`;
  };

  renderer.listitem = (
    text: string,
    task: boolean,
    checked: boolean
  ): string => {
    const classes = task ? ' class="task-list-item"' : '';
    const checkedAttr = task && checked ? ' data-checked="true"' : '';
    return `<li${classes}${checkedAttr}>${text}</li>\n`;
  };

  marked.setOptions({
    ...MARKED_OPTIONS,
    renderer,
  });

  markedConfigured = true;
}

export function renderMarkdown(markdownText: string): string {
  configureMarked();
  const rawHtml = marked.parse(markdownText) as string;
  return sanitizeHtml(rawHtml);
}
