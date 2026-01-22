/**
 * 工具函数单元测试
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  debounce,
  generateTimestampFilename,
  getPlatformInfo,
} from '@/utils';

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('应该在延迟后执行函数', () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 100);

    debouncedFn();
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('应该在多次快速调用时只执行最后一次', () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 100);

    debouncedFn();
    debouncedFn();
    debouncedFn();

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('应该传递正确的参数', () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 100);

    debouncedFn('arg1', 'arg2');

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
  });
});

describe('generateTimestampFilename', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('应该生成正确格式的文件名', () => {
    // 设置固定时间: 2024-01-15 14:30:45
    vi.setSystemTime(new Date(2024, 0, 15, 14, 30, 45));

    const filename = generateTimestampFilename('md');
    expect(filename).toBe('20240115143045.md');
  });

  it('应该支持不同的扩展名', () => {
    vi.setSystemTime(new Date(2024, 0, 15, 14, 30, 45));

    expect(generateTimestampFilename('pdf')).toBe('20240115143045.pdf');
    expect(generateTimestampFilename('txt')).toBe('20240115143045.txt');
  });

  it('应该正确处理月份和日期的补零', () => {
    // 设置时间: 2024-01-05 09:05:05
    vi.setSystemTime(new Date(2024, 0, 5, 9, 5, 5));

    const filename = generateTimestampFilename('md');
    expect(filename).toBe('20240105090505.md');
  });
});

describe('getPlatformInfo', () => {
  it('应该返回平台信息对象', () => {
    const info = getPlatformInfo();

    expect(info).toHaveProperty('isMac');
    expect(info).toHaveProperty('isWindows');
    expect(info).toHaveProperty('isLinux');
    expect(info).toHaveProperty('isMobile');

    expect(typeof info.isMac).toBe('boolean');
    expect(typeof info.isWindows).toBe('boolean');
    expect(typeof info.isLinux).toBe('boolean');
    expect(typeof info.isMobile).toBe('boolean');
  });
});
