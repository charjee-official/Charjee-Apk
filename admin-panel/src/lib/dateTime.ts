const dateTimePattern = /^(\d{2})-(\d{2})-(\d{4})[ T](\d{2}):(\d{2})/;

function pad2(value: number) {
  return String(value).padStart(2, '0');
}

export function formatDateTime(date: Date) {
  return `${pad2(date.getDate())}-${pad2(date.getMonth() + 1)}-${date.getFullYear()} ${pad2(
    date.getHours(),
  )}:${pad2(date.getMinutes())}`;
}

export function parseDateTime(value: string | Date) {
  if (value instanceof Date) {
    return value;
  }

  const trimmed = value.trim();
  const match = trimmed.match(dateTimePattern);
  if (match) {
    const [, day, month, year, hour, minute] = match;
    return new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
}

export function formatDateTimeValue(value?: string | Date | null, fallback = '-') {
  if (!value) {
    return fallback;
  }

  const parsed = parseDateTime(value);
  if (!parsed) {
    return typeof value === 'string' ? value : fallback;
  }

  return formatDateTime(parsed);
}
