"use client";

import { useEffect, useState } from 'react';
import { Section } from '../../../../components/Section';
import { StatusPill } from '../../../../components/StatusPill';
import { Button } from '../../../../components/Button';
import {
  disableStation,
  enableStation,
  fetchDevicesByStation,
  fetchStation,
} from '../../../../lib/api';
import { devices, stations } from '../../../../lib/mockData';
import type { Device, Station } from '../../../../lib/types';

interface Props {
  params: { id: string };
}

export default function StationDetailPage({ params }: Props) {
  const [station, setStation] = useState<Station | null>(
    stations.find((item) => item.id === params.id) ?? null,
  );
  const [stationDevices, setStationDevices] = useState<Device[]>(
    devices.filter((device) => device.stationId === params.id),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetchStation(params.id),
      fetchDevicesByStation(params.id),
    ]).then(([nextStation, nextDevices]) => {
      if (!active) {
        return;
      }
      setStation(nextStation);
      setStationDevices(nextDevices);
    });
    return () => {
      active = false;
    };
  }, [params.id]);

  if (!station) {
    return <Section title="Station not found">Missing station</Section>;
  }

  const handleEnable = async () => {
    if (saving) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const updated = await enableStation(params.id);
      if (updated) {
        setStation(updated);
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
      const updated = await disableStation(params.id);
      if (updated) {
        setStation(updated);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Section title={station.name} subtitle={`Station ID: ${station.id}`}>
      <div className="grid-2">
        <div className="card detail-card">
          <h4 style={{ marginTop: 0 }}>Status</h4>
          <p>Status: <StatusPill value={station.status} /></p>
          <p>Vendor: {station.vendorId}</p>
          <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
            <Button onClick={handleEnable} disabled={saving}>Enable</Button>
            <Button variant="danger" onClick={handleDisable} disabled={saving}>Disable</Button>
          </div>
          {error ? <p style={{ color: 'var(--bad)', marginTop: 8 }}>{error}</p> : null}
        </div>
        <div className="card detail-card">
          <h4 style={{ marginTop: 0 }}>Devices</h4>
          <ul>
            {stationDevices.map((device) => (
              <li key={device.id}>{device.id} ({device.status})</li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}
