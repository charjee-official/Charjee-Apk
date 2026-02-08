'use client';

import type { ReactNode } from 'react';

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={{ display: 'grid', gap: 8, fontSize: 13, color: 'var(--muted)' }}>
      {label}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 12,
          border: '1px solid var(--border)',
          padding: '10px 12px',
          boxShadow: '0 8px 18px rgba(15, 23, 42, 0.06)',
        }}
      >
        {children}
      </div>
    </label>
  );
}
