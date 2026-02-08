'use client';

import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <main className="app-shell">
      <Sidebar />
      <section style={{ display: 'grid', gap: '20px', alignContent: 'start', gridAutoRows: 'max-content' }}>
        <TopBar />
        <div className="fade-in" style={{ display: 'grid', gap: '20px' }}>
          {children}
        </div>
      </section>
    </main>
  );
}
