/**
 * HTML 消毒模块
 * 使用 DOMPurify 防止 XSS 攻击，同时允许安全的 HTML 样式
 */

import DOMPurify, { type Config } from 'dompurify';

type HookEvent = {
  attrName: string;
  attrValue: string | null;
};

// =============================================================================
// DOMPurify 配置
// =============================================================================

/**
 * 允许的 HTML 标签
 * 包含常用的排版标签，但排除危险的脚本/iframe 等
 */
const ALLOWED_TAGS = [
  // 文本格式
  'p',
  'br',
  'hr',
  'span',
  'div',
  'pre',
  'code',
  'blockquote',
  // 标题
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  // 列表
  'ul',
  'ol',
  'li',
  'dl',
  'dt',
  'dd',
  // 表格
  'table',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'th',
  'td',
  'caption',
  'colgroup',
  'col',
  // 文本修饰
  'strong',
  'b',
  'em',
  'i',
  'u',
  's',
  'del',
  'ins',
  'mark',
  'small',
  'sub',
  'sup',
  'abbr',
  'cite',
  'q',
  'kbd',
  'samp',
  'var',
  // 链接和媒体
  'a',
  'img',
  'figure',
  'figcaption',
  'input',
  // 其他
  'details',
  'summary',
  'address',
  'time',
  'ruby',
  'rt',
  'rp',
];

/**
 * 允许的 HTML 属性
 */
const ALLOWED_ATTR = [
  // 通用属性
  'class',
  'id',
  'style',
  'title',
  'lang',
  'dir',
  // 链接属性
  'href',
  'target',
  'rel',
  // 图片属性
  'src',
  'alt',
  'width',
  'height',
  'loading',
  // 表格属性
  'colspan',
  'rowspan',
  'scope',
  'headers',
  // 其他
  'datetime',
  'cite',
  'data-*',
  'aria-*',
  'role',
  'type',
  'checked',
  'disabled',
  'value',
];

/**
 * 允许的 CSS 属性（用于 style 属性）
 * 限制为安全的样式属性，防止 CSS 注入攻击
 */
const ALLOWED_CSS_PROPERTIES = [
  // 颜色
  'color',
  'background-color',
  'background',
  'opacity',
  // 文本
  'font-family',
  'font-size',
  'font-weight',
  'font-style',
  'text-align',
  'text-decoration',
  'text-transform',
  'line-height',
  'letter-spacing',
  'word-spacing',
  'white-space',
  'vertical-align',
  // 边框
  'border',
  'border-radius',
  'border-color',
  'border-width',
  'border-style',
  'border-top',
  'border-right',
  'border-bottom',
  'border-left',
  // 间距
  'margin',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'padding',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  // 尺寸
  'width',
  'height',
  'max-width',
  'max-height',
  'min-width',
  'min-height',
  // 显示
  'display',
  'visibility',
  'overflow',
  'float',
  'clear',
  // 阴影
  'box-shadow',
  'text-shadow',
];

// =============================================================================
// 配置 DOMPurify
// =============================================================================

/**
 * DOMPurify 配置选项
 */
const PURIFY_CONFIG: Config = {
  ALLOWED_TAGS,
  ALLOWED_ATTR,
  // 允许 data: 协议的图片（base64 图片）
  ALLOW_DATA_ATTR: true,
  // 允许的 URI 协议
  ALLOWED_URI_REGEXP:
    /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|data):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
};

/**
 * 自定义钩子：过滤危险的 CSS 属性
 */
DOMPurify.addHook(
  'uponSanitizeAttribute',
  (_node: Element, data: HookEvent) => {
    if (data.attrName === 'style' && data.attrValue) {
      // 解析并过滤 CSS 属性
      const filteredStyles = data.attrValue
        .split(';')
        .map((rule: string) => rule.trim())
        .filter((rule: string) => {
          if (!rule) return false;
          const [property] = rule
            .split(':')
            .map((s: string) => s.trim().toLowerCase());
          return property && ALLOWED_CSS_PROPERTIES.includes(property);
        })
        .join('; ');

      data.attrValue = filteredStyles;
    }
  }
);

/**
 * 自定义钩子：确保外部链接安全
 */
DOMPurify.addHook('afterSanitizeAttributes', (node: Element) => {
  // 为外部链接添加安全属性
  if (node.tagName === 'A') {
    const href = node.getAttribute('href');
    if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener noreferrer');
    }
  }

  // 为图片添加加载优化
  if (node.tagName === 'IMG') {
    if (!node.hasAttribute('loading')) {
      node.setAttribute('loading', 'lazy');
    }
  }

  if (node.tagName === 'INPUT') {
    const type = node.getAttribute('type');
    if (type !== 'checkbox') {
      node.setAttribute('type', 'checkbox');
    }
    if (node.hasAttribute('disabled')) {
      node.removeAttribute('disabled');
    }
  }
});

// =============================================================================
// 导出函数
// =============================================================================

/**
 * 消毒 HTML 内容
 * 移除所有潜在的 XSS 攻击向量，同时保留安全的 HTML 样式
 *
 * @param dirty 可能包含危险内容的 HTML 字符串
 * @returns 安全的 HTML 字符串
 *
 * @example
 * ```ts
 * // 危险脚本会被移除
 * sanitizeHtml('<script>alert("xss")</script>') // => ''
 *
 * // 安全样式会被保留
 * sanitizeHtml('<p style="color:red">文本</p>') // => '<p style="color: red">文本</p>'
 *
 * // 危险事件处理会被移除
 * sanitizeHtml('<img src="x" onerror="alert(1)">') // => '<img src="x">'
 * ```
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, PURIFY_CONFIG);
}

/**
 * 检查 HTML 内容是否包含潜在危险
 *
 * @param html HTML 字符串
 * @returns 如果内容被修改（即原内容有危险），返回 true
 */
export function hasUnsafeContent(html: string): boolean {
  const cleaned = sanitizeHtml(html);
  // 标准化比较（移除空白差异）
  const normalizeHtml = (s: string): string =>
    s.replace(/\s+/g, ' ').trim();
  return normalizeHtml(cleaned) !== normalizeHtml(html);
}

/**
 * 获取当前允许的标签列表
 */
export function getAllowedTags(): readonly string[] {
  return ALLOWED_TAGS;
}

/**
 * 获取当前允许的属性列表
 */
export function getAllowedAttributes(): readonly string[] {
  return ALLOWED_ATTR;
}
