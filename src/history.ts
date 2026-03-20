import { APP_LOCALE } from './locale';

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
const MERGE_WINDOW_MS = 3 * 60 * 1000;
const MIN_MEANINGFUL_DIFF = 20;
const SIMILARITY_THRESHOLD = 0.92;

const monthLabelFormatter = new Intl.DateTimeFormat(APP_LOCALE, {
  year: 'numeric',
  month: 'long',
});

const dayLabelFormatter = new Intl.DateTimeFormat(APP_LOCALE, {
  month: 'short',
  day: 'numeric',
});

const timeLabelFormatter = new Intl.DateTimeFormat(APP_LOCALE, {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

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
  try {
    return safeParse(window.localStorage.getItem(STORAGE_KEY)).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  } catch {
    return [];
  }
}

function persistHistory(entries: HistoryEntry[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // localStorage 满时淘汰最旧一半记录后重试
    const trimmed = entries.slice(0, Math.floor(entries.length / 2));
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch {
      // 仍然失败则静默忽略
    }
  }
}

function normalizeForCompare(content: string): string {
  return content
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase();
}

function getContentSimilarity(a: string, b: string): number {
  const maxLength = Math.max(a.length, b.length);
  if (!maxLength) {
    return 1;
  }

  let sameCount = 0;
  const minLength = Math.min(a.length, b.length);

  for (let index = 0; index < minLength; index += 1) {
    if (a[index] === b[index]) {
      sameCount += 1;
    }
  }

  return sameCount / maxLength;
}

function shouldMergeWithLatest(latestEntry: HistoryEntry | undefined, content: string): boolean {
  if (!latestEntry) {
    return false;
  }

  const now = Date.now();
  const latestTime = new Date(latestEntry.createdAt).getTime();
  const withinMergeWindow = now - latestTime <= MERGE_WINDOW_MS;

  if (!withinMergeWindow) {
    return false;
  }

  const normalizedCurrent = normalizeForCompare(content);
  const normalizedLatest = normalizeForCompare(latestEntry.content);

  if (normalizedCurrent === normalizedLatest) {
    return true;
  }

  const lengthDiff = Math.abs(normalizedCurrent.length - normalizedLatest.length);
  if (lengthDiff >= MIN_MEANINGFUL_DIFF) {
    return false;
  }

  return getContentSimilarity(normalizedCurrent, normalizedLatest) >= SIMILARITY_THRESHOLD;
}

export function saveHistoryEntry(content: string): HistoryEntry[] {
  const normalized = content.trim();

  if (!normalized) {
    return loadHistoryEntries();
  }

  const entries = loadHistoryEntries();
  const latestEntry = entries[0];

  if (shouldMergeWithLatest(latestEntry, content)) {
    const mergedLatest: HistoryEntry = {
      ...latestEntry!,
      content,
      createdAt: new Date().toISOString(),
    };

    const mergedEntries = [mergedLatest, ...entries.slice(1)];
    persistHistory(mergedEntries);
    return mergedEntries;
  }

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
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 静默忽略
  }
}

export function formatMonthLabel(monthKey: string): string {
  const [yearValue, monthValue] = monthKey.split('-');
  const year = Number(yearValue);
  const month = Number(monthValue);
  return monthLabelFormatter.format(new Date(year, month - 1, 1));
}

export function formatDayLabel(dayKey: string): string {
  const date = new Date(`${dayKey}T00:00:00`);
  return dayLabelFormatter.format(date);
}

export function formatTimeLabel(isoTime: string): string {
  const date = new Date(isoTime);
  return timeLabelFormatter.format(date);
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
