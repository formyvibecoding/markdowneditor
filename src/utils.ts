/**
 * 工具函数模块
 */

// =============================================================================
// 类型定义
// =============================================================================
type DebouncedFunction<T extends (...args: unknown[]) => unknown> = (
  ...args: Parameters<T>
) => void;

// =============================================================================
// 防抖函数
// =============================================================================
/**
 * 创建防抖函数
 * @param fn 要防抖的函数
 * @param delay 延迟时间（毫秒）
 * @returns 防抖后的函数
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): DebouncedFunction<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (this: unknown, ...args: Parameters<T>): void {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn.apply(this, args);
      timeoutId = null;
    }, delay);
  };
}

// =============================================================================
// 平台检测（使用现代 API）
// =============================================================================
interface PlatformInfo {
  isMac: boolean;
  isWindows: boolean;
  isLinux: boolean;
  isMobile: boolean;
}

/**
 * 获取平台信息
 * 使用现代 userAgentData API，回退到 userAgent
 */
export function getPlatformInfo(): PlatformInfo {
  // 优先使用 User-Agent Client Hints API (现代浏览器)
  const nav = navigator as Navigator & {
    userAgentData?: {
      platform?: string;
      mobile?: boolean;
    };
  };

  if (nav.userAgentData) {
    const platform = nav.userAgentData.platform?.toLowerCase() ?? '';
    return {
      isMac: platform === 'macos',
      isWindows: platform === 'windows',
      isLinux: platform === 'linux',
      isMobile: nav.userAgentData.mobile ?? false,
    };
  }

  // 回退到传统 userAgent 检测
  const ua = navigator.userAgent.toLowerCase();
  return {
    isMac: ua.includes('mac'),
    isWindows: ua.includes('win'),
    isLinux: ua.includes('linux'),
    isMobile: /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
      ua
    ),
  };
}

// =============================================================================
// 文件下载工具
// =============================================================================
/**
 * 触发文件下载
 * @param blob 文件 Blob 对象
 * @param filename 文件名
 */
export function downloadFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();

  // 延迟释放资源，确保下载完成
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
}

/**
 * 生成时间戳文件名
 * @param extension 文件扩展名
 * @returns 格式为 YYYYMMDDHHmmss.ext 的文件名
 */
export function generateTimestampFilename(extension: string): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  return `${year}${month}${day}${hours}${minutes}${seconds}.${extension}`;
}

// =============================================================================
// CDN 加载工具（带回退）
// =============================================================================
/**
 * 加载外部脚本，支持多个 CDN 回退
 * @param urls CDN URL 数组（按优先级排序）
 * @returns Promise，加载成功时 resolve
 */
export function loadScriptWithFallback(urls: readonly string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    let currentIndex = 0;

    const tryLoad = (): void => {
      if (currentIndex >= urls.length) {
        reject(new Error(`所有 CDN 源加载失败: ${urls.join(', ')}`));
        return;
      }

      const url = urls[currentIndex];
      if (!url) {
        reject(new Error('URL 不存在'));
        return;
      }

      const script = document.createElement('script');
      script.src = url;
      script.async = true;

      script.onload = (): void => {
        resolve();
      };

      script.onerror = (): void => {
        currentIndex++;
        // 移除失败的脚本标签
        script.remove();
        tryLoad();
      };

      document.head.appendChild(script);
    };

    tryLoad();
  });
}

/**
 * 加载外部 CSS
 * @param url CSS URL
 * @returns Promise
 */
export function loadStylesheet(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;

    link.onload = (): void => resolve();
    link.onerror = (): void => reject(new Error(`CSS 加载失败: ${url}`));

    document.head.appendChild(link);
  });
}

// =============================================================================
// 错误处理工具
// =============================================================================
/**
 * 安全执行异步函数，捕获错误并显示给用户
 * @param fn 要执行的异步函数
 * @param errorMessage 错误时显示的消息前缀
 */
export async function safeExecute<T>(
  fn: () => Promise<T>,
  errorMessage: string
): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);
    // 使用 console.error 而非 console.log
    console.error(`${errorMessage}:`, error);
    alert(`${errorMessage}: ${message}`);
    return null;
  }
}

// =============================================================================
// DOM 工具
// =============================================================================
/**
 * 安全获取 DOM 元素
 * @param id 元素 ID
 * @returns 元素或 null
 */
export function getElement<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

/**
 * 必须获取 DOM 元素，如果不存在则抛出错误
 * @param id 元素 ID
 * @returns 元素
 */
export function requireElement<T extends HTMLElement>(id: string): T {
  const element = getElement<T>(id);
  if (!element) {
    throw new Error(`必需的 DOM 元素不存在: #${id}`);
  }
  return element;
}
