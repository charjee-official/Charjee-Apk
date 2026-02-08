const ddmmyyyyPattern = /^(\d{2})-(\d{2})-(\d{4})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/;
const isoPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;
const pgPattern = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/;

function pad2(value: number) {
  return String(value).padStart(2, '0');
}

export function formatDateTime(date: Date) {
  return `${pad2(date.getDate())}-${pad2(date.getMonth() + 1)}-${date.getFullYear()} ${pad2(
    date.getHours(),
  )}:${pad2(date.getMinutes())}`;
}

export function parseDateTimeValue(value: string | Date) {
  if (value instanceof Date) {
    return value;
  }

  const trimmed = value.trim();
  const match = trimmed.match(ddmmyyyyPattern);
  if (match) {
    const [, day, month, year, hour, minute, second] = match;
    return new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second ?? 0),
    );
  }

  if (pgPattern.test(trimmed)) {
    const normalized = trimmed.replace(' ', 'T');
    const parsed = new Date(normalized);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  if (isoPattern.test(trimmed)) {
    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
}

function transformValue(value: unknown, seen: WeakSet<object>): unknown {
  if (value instanceof Date) {
    return formatDateTime(value);
  }

  if (typeof value === 'string') {
    const parsed = parseDateTimeValue(value);
    return parsed ? formatDateTime(parsed) : value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => transformValue(item, seen));
  }

  if (value && typeof value === 'object') {
    if (seen.has(value as object)) {
      return value;
    }
    seen.add(value as object);
    const output: Record<string, unknown> = {};
    Object.entries(value as Record<string, unknown>).forEach(([key, entry]) => {
      output[key] = transformValue(entry, seen);
    });
    return output;
  }

  return value;
}

export function serializeDateTimes<T>(input: T): T {
  return transformValue(input, new WeakSet()) as T;
}
