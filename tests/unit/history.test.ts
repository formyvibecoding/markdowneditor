import { describe, expect, it } from 'vitest';
import {
  formatDayLabel,
  formatMonthLabel,
  groupHistoryEntries,
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
