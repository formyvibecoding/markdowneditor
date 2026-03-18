import { describe, expect, it } from 'vitest';
import { renderMarkdown } from '@/markdown';

describe('renderMarkdown', () => {
  it('renders core GFM constructs', () => {
    const html = renderMarkdown(`
| Left | Center | Right |
| :--- | :----: | ----: |
| a | b | c |

- [x] done
- [ ] todo

Visit https://example.com

~~removed~~

\`\`\`ts
const value = 1;
\`\`\`
`);

    expect(html).toContain('<table>');
    expect(html).toContain('<th align="left">Left</th>');
    expect(html).toContain('<th align="center">Center</th>');
    expect(html).toContain('<th align="right">Right</th>');
    expect(html).toMatch(
      /<input class="task-list-item-checkbox" type="checkbox" checked="">/
    );
    expect(html).toContain('<input class="task-list-item-checkbox" type="checkbox">');
    expect(html).toContain('<li class="task-list-item" data-checked="true">');
    expect(html).toContain('<a href="https://example.com"');
    expect(html).toContain('<del>removed</del>');
    expect(html).toContain('<code class="language-ts">const value = 1;');
  });

  it('keeps task list checkboxes interactive-safe after sanitizing', () => {
    const html = renderMarkdown('- [x] done');

    expect(html).not.toContain('disabled=""');
    expect(html).toContain('type="checkbox"');
  });
});
