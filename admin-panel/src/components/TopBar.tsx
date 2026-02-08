'use client';

import { useRouter } from 'next/navigation';
import { clearToken } from '../lib/auth';
import { Button } from './Button';

export function TopBar() {
  const router = useRouter();

  const handleLogout = () => {
    clearToken();
    router.replace('/login');
  };

  return (
    <header className="panel topbar">
      <div>
        <div className="topbar-meta">System Overview</div>
        <strong className="topbar-title">EV Platform Operations</strong>
      </div>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <span style={{ color: 'var(--muted)', fontSize: 13 }}>Admin</span>
        <Button variant="ghost" onClick={handleLogout}>Log out</Button>
      </div>
    </header>
  );
}
