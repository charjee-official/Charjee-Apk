"use client";

import { useEffect, useState } from 'react';
import { Section } from '../../../../components/Section';
import { StatusPill } from '../../../../components/StatusPill';
import { Button } from '../../../../components/Button';
import { fetchSession, forceStopSession } from '../../../../lib/api';
import { formatDateTimeValue } from '../../../../lib/dateTime';
import { activeSessions, sessionHistory } from '../../../../lib/mockData';
import type { Session } from '../../../../lib/types';

interface Props {
  params: { id: string };
}

export default function SessionDetailPage({ params }: Props) {
  const [session, setSession] = useState<Session | null>(
    [...activeSessions, ...sessionHistory].find((item) => item.id === params.id) ?? null,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchSession(params.id).then((nextSession) => {
      if (!active) {
        return;
      }
      setSession(nextSession);
    });

    return () => {
      active = false;
    };
  }, [params.id]);

  if (!session) {
    return <Section title="Session not found">Missing session</Section>;
  }

  const handleForceStop = async () => {
    if (saving) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await forceStopSession(params.id);
      const updated = await fetchSession(params.id);
      setSession(updated);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Section title={session.id} subtitle={`Device ${session.deviceId}`}>
      <div className="grid-2">
        <div className="card detail-card">
          <h4 style={{ marginTop: 0 }}>Session Summary</h4>
          <p>Status: <StatusPill value={session.status} /></p>
          <p>User: {session.user}</p>
          <p>Start: {formatDateTimeValue(session.startedAt ?? session.startTime, '—')}</p>
          <p>End: {formatDateTimeValue(session.endedAt, '—')}</p>
          <p>Energy: {session.energyKwh} kWh</p>
          <p>Cost: INR {session.cost}</p>
          <p>Close Reason: {session.closeReason ?? 'Active'}</p>
          <p>Illegal: {session.illegal ? 'Yes' : 'No'}</p>
        </div>
        <div className="card detail-card">
          <h4 style={{ marginTop: 0 }}>Actions</h4>
          <Button variant="danger" onClick={handleForceStop} disabled={saving}>Force Stop</Button>
          {error ? <p style={{ color: 'var(--bad)', marginTop: 8 }}>{error}</p> : null}
        </div>
      </div>
    </Section>
  );
}
