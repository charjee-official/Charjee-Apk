import type { ReactNode } from 'react';

export function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <section className="panel" style={{ padding: '20px', display: 'grid', gap: '16px' }}>
      <div className="section-head">
        <div>
          <h3>{title}</h3>
          {subtitle ? <p className="section-subtitle">{subtitle}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}
