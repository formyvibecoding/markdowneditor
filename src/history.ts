export type HistoryEntryType = 'draft';

export interface HistoryEntry {
  id: string;
  content: string;
  createdAt: string;
  type: HistoryEntryType;
}

export interface DayGroup {
  day: string;
  entries: HistoryEntry[];
}

export interface MonthGroup {
  month: string;
  days: DayGroup[];
}

const STORAGE_KEY = 'markdown-editor-history-v1';
const MAX_HISTORY_ITEMS = 300;

function safeParse(value: string | null): HistoryEntry[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as HistoryEntry[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(item => {
      return (
        typeof item.id === 'string' &&
        typeof item.content === 'string' &&
        typeof item.createdAt === 'string' &&
        item.type === 'draft'
      );
    });
  } catch {
    return [];
  }
}

export function loadHistoryEntries(): HistoryEntry[] {
  return safeParse(window.localStorage.getItem(STORAGE_KEY)).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

function persistHistory(entries: HistoryEntry[]): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function saveHistoryEntry(content: string): HistoryEntry[] {
  const normalized = content.trim();

  if (!normalized) {
    return loadHistoryEntries();
  }

  const entries = loadHistoryEntries();
  const latestEntry = entries[0];

  if (latestEntry?.content === content) {
    return entries;
  }

  const nextEntry: HistoryEntry = {
    id: crypto.randomUUID(),
    content,
    createdAt: new Date().toISOString(),
    type: 'draft',
  };

  const nextEntries = [nextEntry, ...entries].slice(0, MAX_HISTORY_ITEMS);
  persistHistory(nextEntries);
  return nextEntries;
}

export function deleteHistoryEntry(entryId: string): HistoryEntry[] {
  const nextEntries = loadHistoryEntries().filter(entry => entry.id !== entryId);
  persistHistory(nextEntries);
  return nextEntries;
}

export function clearHistoryEntries(): void {
  window.localStorage.removeItem(STORAGE_KEY);
}

export function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number);
  return `${year}年${month}月`;
}

export function formatDayLabel(dayKey: string): string {
  const date = new Date(`${dayKey}T00:00:00`);
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

export function formatTimeLabel(isoTime: string): string {
  const date = new Date(isoTime);
  return date.toLocaleTimeString('zh-CN', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function groupHistoryEntries(entries: HistoryEntry[]): MonthGroup[] {
  const monthMap = new Map<string, Map<string, HistoryEntry[]>>();

  entries.forEach(entry => {
    const date = new Date(entry.createdAt);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const dayKey = `${monthKey}-${String(date.getDate()).padStart(2, '0')}`;

    const monthDays = monthMap.get(monthKey) ?? new Map<string, HistoryEntry[]>();
    const dayEntries = monthDays.get(dayKey) ?? [];

    dayEntries.push(entry);
    monthDays.set(dayKey, dayEntries);
    monthMap.set(monthKey, monthDays);
  });

  return [...monthMap.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([month, daysMap]) => ({
      month,
      days: [...daysMap.entries()]
        .sort((a, b) => b[0].localeCompare(a[0]))
        .map(([day, dayEntries]) => ({
          day,
          entries: dayEntries.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          ),
        })),
    }));
}
