'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '../../components/AppShell';
import { getToken, isSessionExpired, startActivityMonitor } from '../../lib/auth';

export default function AppLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token || isSessionExpired()) {
      router.replace('/login');
      return;
    }

    const stop = startActivityMonitor();
    setReady(true);

    return () => stop();
  }, [router]);

  if (!ready) {
    return null;
  }

  return <AppShell>{children}</AppShell>;
}
