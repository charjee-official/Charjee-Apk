"use client";

import { useEffect, useState } from 'react';
import { Section } from '../../../../components/Section';
import { StatusPill } from '../../../../components/StatusPill';
import { Button } from '../../../../components/Button';
import {
  disableDevice,
  enableDevice,
  fetchActiveSessions,
  fetchDevice,
  forceStopSession,
} from '../../../../lib/api';
import { activeSessions, devices } from '../../../../lib/mockData';
import type { Device, Session } from '../../../../lib/types';

interface Props {
  params: { id: string };
}

export default function DeviceDetailPage({ params }: Props) {
  const [device, setDevice] = useState<Device | null>(
    devices.find((item) => item.id === params.id) ?? null,
  );
  const [currentSession, setCurrentSession] = useState<Session | undefined>(
    activeSessions.find((session) => session.deviceId === params.id),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([fetchDevice(params.id), fetchActiveSessions()]).then(
      ([nextDevice, sessions]) => {
        if (!active) {
          return;
        }
        setDevice(nextDevice);
        setCurrentSession(sessions.find((session) => session.deviceId === params.id));
      },
    );
    return () => {
      active = false;
    };
  }, [params.id]);

  if (!device) {
    return <Section title="Device not found">Missing device</Section>;
  }

  const refresh = async () => {
    const [nextDevice, sessions] = await Promise.all([
      fetchDevice(params.id),
      fetchActiveSessions(),
    ]);
    if (nextDevice) {
      setDevice(nextDevice);
    }
    setCurrentSession(sessions.find((session) => session.deviceId === params.id));
  };

  const handleEnable = async () => {
    if (saving) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const updated = await enableDevice(params.id);
      if (updated) {
        setDevice(updated);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDisable = async () => {
    if (saving) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const updated = await disableDevice(params.id);
      if (updated) {
        setDevice(updated);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleForceStop = async () => {
    if (!currentSession || saving) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await forceStopSession(currentSession.id);
      await refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Section title={device.id} subtitle={`Station ${device.stationId} | Vendor ${device.vendorId}`}>
      <div className="grid-2">
        <div className="card detail-card">
          <h4 style={{ marginTop: 0 }}>Status</h4>
          <p>Status: <StatusPill value={device.status} /></p>
          <p>Last Heartbeat: {device.lastHeartbeat}</p>
          <p>Fault: {device.fault ?? 'None'}</p>
          <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
            <Button onClick={handleEnable} disabled={saving}>Enable</Button>
            <Button variant="danger" onClick={handleDisable} disabled={saving}>Disable</Button>
          </div>
          {error ? <p style={{ color: 'var(--bad)', marginTop: 8 }}>{error}</p> : null}
        </div>
        <div className="card detail-card">
          <h4 style={{ marginTop: 0 }}>Current Session</h4>
          {currentSession ? (
            <div>
              <p>Session: {currentSession.id}</p>
              <p>User: {currentSession.user}</p>
              <p>Energy: {currentSession.energyKwh} kWh</p>
              <Button variant="danger" onClick={handleForceStop} disabled={saving}>Force Stop</Button>
            </div>
          ) : (
            <p>No active session.</p>
          )}
        </div>
      </div>
    </Section>
  );
}
