import type { ReactNode } from 'react';

export function StatCard({ label, value, trend }: { label: string; value: ReactNode; trend?: string }) {
  return (
    <div className="card">
      <div style={{ color: 'var(--muted)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {label}
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, marginTop: 6 }}>{value}</div>
      {trend ? <div style={{ color: 'var(--accent)', fontSize: 12, marginTop: 8 }}>{trend}</div> : null}
    </div>
  );
}
