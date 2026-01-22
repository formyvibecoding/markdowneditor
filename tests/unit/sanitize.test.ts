/**
 * HTML 消毒模块单元测试
 */

import { describe, it, expect } from 'vitest';
import {
  sanitizeHtml,
  hasUnsafeContent,
  getAllowedTags,
  getAllowedAttributes,
} from '@/sanitize';

describe('sanitizeHtml', () => {
  describe('XSS 攻击防护', () => {
    it('应该移除 script 标签', () => {
      const dirty = '<script>alert("xss")</script>';
      const clean = sanitizeHtml(dirty);
      expect(clean).not.toContain('<script>');
      expect(clean).not.toContain('alert');
    });

    it('应该移除 onerror 事件处理器', () => {
      const dirty = '<img src="x" onerror="alert(1)">';
      const clean = sanitizeHtml(dirty);
      expect(clean).not.toContain('onerror');
    });

    it('应该移除 onclick 事件处理器', () => {
      const dirty = '<button onclick="alert(1)">Click</button>';
      const clean = sanitizeHtml(dirty);
      expect(clean).not.toContain('onclick');
    });

    it('应该移除 javascript: 协议链接', () => {
      const dirty = '<a href="javascript:alert(1)">Click</a>';
      const clean = sanitizeHtml(dirty);
      expect(clean).not.toContain('javascript:');
    });

    it('应该移除 iframe 标签', () => {
      const dirty = '<iframe src="https://evil.com"></iframe>';
      const clean = sanitizeHtml(dirty);
      expect(clean).not.toContain('<iframe');
    });

    it('应该移除 svg 中的恶意内容', () => {
      const dirty = '<svg onload="alert(1)"><circle/></svg>';
      const clean = sanitizeHtml(dirty);
      expect(clean).not.toContain('onload');
    });
  });

  describe('安全内容保留', () => {
    it('应该保留安全的段落标签', () => {
      const dirty = '<p>Hello World</p>';
      const clean = sanitizeHtml(dirty);
      expect(clean).toContain('<p>');
      expect(clean).toContain('Hello World');
    });

    it('应该保留安全的样式属性', () => {
      const dirty = '<p style="color:red">Red text</p>';
      const clean = sanitizeHtml(dirty);
      expect(clean).toContain('color');
      expect(clean).toContain('red');
    });

    it('应该保留多个安全的 CSS 属性', () => {
      const dirty =
        '<span style="color: blue; font-size: 16px; margin: 10px;">Styled</span>';
      const clean = sanitizeHtml(dirty);
      expect(clean).toContain('color');
      expect(clean).toContain('font-size');
      expect(clean).toContain('margin');
    });

    it('应该保留安全的链接', () => {
      const dirty = '<a href="https://example.com">Link</a>';
      const clean = sanitizeHtml(dirty);
      expect(clean).toContain('href="https://example.com"');
    });

    it('应该保留表格结构', () => {
      const dirty = '<table><tr><th>Header</th></tr><tr><td>Cell</td></tr></table>';
      const clean = sanitizeHtml(dirty);
      expect(clean).toContain('<table>');
      expect(clean).toContain('<th>');
      expect(clean).toContain('<td>');
    });

    it('应该保留代码块', () => {
      const dirty = '<pre><code>const x = 1;</code></pre>';
      const clean = sanitizeHtml(dirty);
      expect(clean).toContain('<pre>');
      expect(clean).toContain('<code>');
      expect(clean).toContain('const x = 1;');
    });

    it('应该保留图片标签', () => {
      const dirty = '<img src="image.png" alt="Description">';
      const clean = sanitizeHtml(dirty);
      expect(clean).toContain('<img');
      expect(clean).toContain('src="image.png"');
      expect(clean).toContain('alt="Description"');
    });
  });

  describe('CSS 属性过滤', () => {
    it('应该移除危险的 CSS 属性（如 expression）', () => {
      const dirty = '<p style="width: expression(alert(1))">Text</p>';
      const clean = sanitizeHtml(dirty);
      expect(clean).not.toContain('expression');
    });

    it('应该移除 position: fixed（可用于覆盖页面）', () => {
      // position 不在允许列表中
      const dirty = '<div style="position: fixed; top: 0;">Overlay</div>';
      const clean = sanitizeHtml(dirty);
      expect(clean).not.toContain('position');
    });
  });

  describe('链接安全处理', () => {
    it('应该为外部链接添加 target="_blank"', () => {
      const dirty = '<a href="https://external.com">External</a>';
      const clean = sanitizeHtml(dirty);
      expect(clean).toContain('target="_blank"');
    });

    it('应该为外部链接添加 rel="noopener noreferrer"', () => {
      const dirty = '<a href="https://external.com">External</a>';
      const clean = sanitizeHtml(dirty);
      expect(clean).toContain('rel="noopener noreferrer"');
    });
  });
});

describe('hasUnsafeContent', () => {
  it('应该检测到危险内容', () => {
    expect(hasUnsafeContent('<script>alert(1)</script>')).toBe(true);
    expect(hasUnsafeContent('<img onerror="alert(1)">')).toBe(true);
  });

  it('应该认为安全内容是安全的', () => {
    expect(hasUnsafeContent('<p>Hello</p>')).toBe(false);
    expect(hasUnsafeContent('<strong>Bold</strong>')).toBe(false);
  });
});

describe('getAllowedTags', () => {
  it('应该返回允许的标签数组', () => {
    const tags = getAllowedTags();
    expect(Array.isArray(tags)).toBe(true);
    expect(tags).toContain('p');
    expect(tags).toContain('div');
    expect(tags).toContain('span');
    expect(tags).toContain('a');
    expect(tags).toContain('img');
  });

  it('不应该包含危险标签', () => {
    const tags = getAllowedTags();
    expect(tags).not.toContain('script');
    expect(tags).not.toContain('iframe');
    expect(tags).not.toContain('object');
    expect(tags).not.toContain('embed');
  });
});

describe('getAllowedAttributes', () => {
  it('应该返回允许的属性数组', () => {
    const attrs = getAllowedAttributes();
    expect(Array.isArray(attrs)).toBe(true);
    expect(attrs).toContain('class');
    expect(attrs).toContain('id');
    expect(attrs).toContain('style');
    expect(attrs).toContain('href');
  });

  it('不应该包含事件处理属性', () => {
    const attrs = getAllowedAttributes();
    expect(attrs).not.toContain('onclick');
    expect(attrs).not.toContain('onerror');
    expect(attrs).not.toContain('onload');
  });
});
