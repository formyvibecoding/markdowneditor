import { describe, it, expect } from 'vitest';
import { generatePreviewHtml } from '@/templates/preview';

describe('preview color swatch enhancement', () => {
  it('should include color swatch styles and script hooks', () => {
    const html = generatePreviewHtml('<p>Color: #ffffff</p>');

    expect(html).toContain('.color-code-inline');
    expect(html).toContain('.color-swatch-btn');
    expect(html).toContain('function enhanceColorCodes()');
    expect(html).toContain('createColorSwatchButton(colorCode)');
    expect(html).toContain('enhanceColorCodes();');
    expect(html).toContain('点击复制颜色值');
  });
});
