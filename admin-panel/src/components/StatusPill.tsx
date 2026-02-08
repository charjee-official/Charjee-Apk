import type { ReactNode } from 'react';

const colors: Record<string, string> = {
  online: 'var(--good)',
  offline: 'var(--bad)',
  active: 'var(--accent)',
  stopped: 'var(--muted)',
  pending: 'var(--warn)',
  booked: 'var(--accent)',
  completed: 'var(--good)',
  expired: 'var(--bad)',
  alert: 'var(--warn)',
};

export function StatusPill({ value }: { value: string }) {
  const color = colors[value.toLowerCase()] ?? 'var(--muted)';
  return (
    <span style={{
      padding: '4px 10px',
      borderRadius: 999,
      fontSize: 12,
      border: `1px solid ${color}`,
      color,
      textTransform: 'capitalize',
    }}>{value}</span>
  );
}
