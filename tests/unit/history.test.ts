import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearHistoryEntries,
  formatDayLabel,
  formatMonthLabel,
  groupHistoryEntries,
  loadHistoryEntries,
  saveHistoryEntry,
  type HistoryEntry,
} from '@/history';

describe('history helpers', () => {
  it('应该按月和日进行分组', () => {
    const entries: HistoryEntry[] = [
      {
        id: '3',
        content: 'third',
        createdAt: '2026-02-11T08:00:00.000Z',
        type: 'draft',
      },
      {
        id: '2',
        content: 'second',
        createdAt: '2026-02-11T09:00:00.000Z',
        type: 'draft',
      },
      {
        id: '1',
        content: 'first',
        createdAt: '2026-01-01T01:00:00.000Z',
        type: 'draft',
      },
    ];

    const grouped = groupHistoryEntries(entries);

    expect(grouped).toHaveLength(2);
    expect(grouped[0].month).toBe('2026-02');
    expect(grouped[0].days[0].day).toBe('2026-02-11');
    expect(grouped[0].days[0].entries[0].id).toBe('2');
    expect(grouped[1].month).toBe('2026-01');
  });

  it('应该格式化月份和日期标签', () => {
    expect(formatMonthLabel('2026-02')).toBe('2026年2月');
    expect(formatDayLabel('2026-02-11')).toBe('2月11日');
  });
});

describe('history save strategy', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-13T09:22:00.000Z'));
    clearHistoryEntries();
  });

  afterEach(() => {
    clearHistoryEntries();
    vi.useRealTimers();
  });

  it('应在时间窗口内合并轻微修改，避免重复记录', () => {
    saveHistoryEntry('2026-02-13 早上的 AiTEN 会议');
    vi.advanceTimersByTime(20_000);
    const entries = saveHistoryEntry('2026-02-13 早上的 AiTEN 会议的弱智现象');

    expect(entries).toHaveLength(1);
    expect(entries[0].content).toBe('2026-02-13 早上的 AiTEN 会议的弱智现象');
    expect(loadHistoryEntries()).toHaveLength(1);
  });

  it('应在时间窗口外创建新记录，保留代表性版本', () => {
    saveHistoryEntry('版本一');
    vi.advanceTimersByTime(4 * 60 * 1000);
    const entries = saveHistoryEntry('版本二（变化明显）');

    expect(entries).toHaveLength(2);
    expect(entries[0].content).toBe('版本二（变化明显）');
    expect(entries[1].content).toBe('版本一');
  });
});
