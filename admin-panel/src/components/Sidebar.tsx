'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { dashboardStats, navItems } from '../lib/mockData';

const iconByLabel: Record<string, JSX.Element> = {
  dashboard: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2 9.5h4V14H2V9.5Zm0-7h7v5H2v-5Zm9 6h3V14h-3V8.5Zm0-6h3v4h-3v-4Z" fill="currentColor" />
    </svg>
  ),
  vendors: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2.5 6.5a3 3 0 1 1 6 0 3 3 0 0 1-6 0Zm8 2a2.5 2.5 0 1 0-2.4-3.3 4.5 4.5 0 0 1 2.4 3.3ZM1.5 14a4.5 4.5 0 0 1 9 0H1.5Zm9.5 0c0-1.1-.4-2.1-1-2.9a4.5 4.5 0 0 1 5 2.9h-4Z" fill="currentColor" />
    </svg>
  ),
  stations: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 1h10v3H3V1Zm1 4h8v10H4V5Zm2 2v2h4V7H6Z" fill="currentColor" />
    </svg>
  ),
  devices: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 2h10v10H3V2Zm2 12h6v1H5v-1Zm2-9h2v4H7V5Z" fill="currentColor" />
    </svg>
  ),
  sessions: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 1a7 7 0 1 1-6.2 3.7l1.6.8A5.5 5.5 0 1 0 8 2.5V1Z" fill="currentColor" />
      <path d="M7.5 4h1v4.1l2.6 1.5-.5.9-3.1-1.8V4Z" fill="currentColor" />
    </svg>
  ),
  'active sessions': (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 1a7 7 0 1 1-6.2 3.7l1.6.8A5.5 5.5 0 1 0 8 2.5V1Z" fill="currentColor" />
      <path d="M7.5 4h1v4.1l2.6 1.5-.5.9-3.1-1.8V4Z" fill="currentColor" />
    </svg>
  ),
  'session history': (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2 3h9v2H2V3Zm0 4h12v2H2V7Zm0 4h9v2H2v-2Z" fill="currentColor" />
      <path d="M12.5 2.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Zm0 1.2a1.3 1.3 0 1 0 0 2.6 1.3 1.3 0 0 0 0-2.6Z" fill="currentColor" />
    </svg>
  ),
  finance: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2 4h12v8H2V4Zm1 1v6h10V5H3Zm2 1h3v1H5V6Zm0 2h5v1H5V8Z" fill="currentColor" />
    </svg>
  ),
  wallet: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2 4h12v8H2V4Zm1 1v6h10V5H3Zm7 2h2v2h-2V7Z" fill="currentColor" />
    </svg>
  ),
  bookings: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 2h10v12H3V2Zm1 1v2h8V3H4Zm0 4h8v2H4V7Zm0 4h5v2H4v-2Z" fill="currentColor" />
    </svg>
  ),
  alerts: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 1 1 14h14L8 1Zm0 4.5 1 4.5H7l1-4.5Zm-1 6.5h2v2H7v-2Z" fill="currentColor" />
    </svg>
  ),
  settings: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M6.5 1h3l.4 1.7 1.7.7 1.5-.9 2.1 2.1-.9 1.5.7 1.7L15 9.5v3l-1.7.4-.7 1.7.9 1.5-2.1 2.1-1.5-.9-1.7.7-.4 1.7h-3l-.4-1.7-1.7-.7-1.5.9-2.1-2.1.9-1.5-.7-1.7L1 12.5v-3l1.7-.4.7-1.7-.9-1.5L4.6 3.5l1.5.9 1.7-.7L6.5 1Zm1.5 5a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" fill="currentColor" />
    </svg>
  ),
  activity: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2 12h12v2H2v-2Zm1-9h2v7H3V3Zm4 3h2v4H7V6Zm4-2h2v6h-2V4Z" fill="currentColor" />
    </svg>
  ),
  'login activity': (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2 12h12v2H2v-2Zm1-9h2v7H3V3Zm4 3h2v4H7V6Zm4-2h2v6h-2V4Z" fill="currentColor" />
    </svg>
  ),
};

const iconByHref: Record<string, JSX.Element> = {
  '/dashboard': iconByLabel.dashboard,
  '/vendors': iconByLabel.vendors,
  '/stations': iconByLabel.stations,
  '/devices': iconByLabel.devices,
  '/sessions/active': iconByLabel['active sessions'],
  '/sessions/history': iconByLabel['session history'],
  '/finance': iconByLabel.finance,
  '/wallet': iconByLabel.wallet,
  '/bookings': iconByLabel.bookings,
  '/alerts': iconByLabel.alerts,
  '/settings': iconByLabel.settings,
  '/activity': iconByLabel['login activity'],
};

const fallbackIcon = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.6" />
  </svg>
);

function resolveIcon(href: string, label: string) {
  switch (href) {
    case '/sessions/active':
      return iconByLabel['active sessions'];
    case '/sessions/history':
      return iconByLabel['session history'];
    case '/activity':
      return iconByLabel['login activity'];
    default: {
      const key = label.trim().toLowerCase();
      return iconByHref[href] ?? iconByLabel[key] ?? fallbackIcon;
    }
  }
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="panel" style={{ padding: '22px', height: 'fit-content', position: 'sticky', top: 24 }}>
      <div className="side-brand">
        <h2 style={{ margin: 0 }}>Charjee Admin</h2>
        <p style={{ color: 'var(--muted)', margin: 0 }}>Control Tower</p>
      </div>
      <nav className="nav-list">
        {navItems.map((item) => {
          const active = pathname?.startsWith(item.href);
          const icon = resolveIcon(item.href, item.label);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item${active ? ' active' : ''}`}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="nav-icon">{icon}</span>
                <strong>{item.label}</strong>
                {item.label === 'Alerts' && dashboardStats.criticalAlerts > 0 ? (
                  <span className="alert-badge">{dashboardStats.criticalAlerts}</span>
                ) : null}
              </div>
              <div style={{ color: 'var(--muted)', fontSize: 12 }}>{item.caption}</div>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
