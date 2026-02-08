"use client";

import { useEffect, useState } from 'react';
import { Section } from '../../../../components/Section';
import { StatusPill } from '../../../../components/StatusPill';
import { Button } from '../../../../components/Button';
import {
  approveVendor,
  fetchDevicesByVendor,
  fetchStationsByVendor,
  fetchVendor,
  suspendVendor,
} from '../../../../lib/api';
import { devices, stations, vendors } from '../../../../lib/mockData';
import type { Device, Station, Vendor } from '../../../../lib/types';

interface Props {
  params: { id: string };
}

export default function VendorDetailPage({ params }: Props) {
  const [vendor, setVendor] = useState<Vendor | null>(
    vendors.find((item) => item.id === params.id) ?? null,
  );
  const [vendorStations, setVendorStations] = useState<Station[]>(
    stations.filter((station) => station.vendorId === params.id),
  );
  const [vendorDevices, setVendorDevices] = useState<Device[]>(
    devices.filter((device) => device.vendorId === params.id),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetchVendor(params.id),
      fetchStationsByVendor(params.id),
      fetchDevicesByVendor(params.id),
    ]).then(([nextVendor, nextStations, nextDevices]) => {
      if (!active) {
        return;
      }
      setVendor(nextVendor);
      setVendorStations(nextStations);
      setVendorDevices(nextDevices);
    });

    return () => {
      active = false;
    };
  }, [params.id]);

  if (!vendor) {
    return <Section title="Vendor not found">Missing vendor</Section>;
  }

  const handleApprove = async () => {
    if (saving) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const updated = await approveVendor(params.id);
      if (updated) {
        setVendor(updated);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleSuspend = async () => {
    if (saving) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const updated = await suspendVendor(params.id);
      if (updated) {
        setVendor(updated);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Section title={vendor.name} subtitle={`Vendor ID: ${vendor.id}`}>
      <div className="grid-2">
        <div className="card detail-card">
          <h4 style={{ marginTop: 0 }}>KYC & Status</h4>
          <p>KYC: <StatusPill value={vendor.kyc} /></p>
          <p>Status: <StatusPill value={vendor.status} /></p>
          <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
            <Button onClick={handleApprove} disabled={saving}>Approve</Button>
            <Button variant="danger" onClick={handleSuspend} disabled={saving}>Suspend</Button>
          </div>
          {error ? <p style={{ color: 'var(--bad)', marginTop: 8 }}>{error}</p> : null}
        </div>
        <div className="card detail-card">
          <h4 style={{ marginTop: 0 }}>Revenue Summary</h4>
          <p>Total Revenue: INR {vendor.revenue.toLocaleString('en-IN')}</p>
          <p>Platform Share (20%): INR {(vendor.revenue * 0.2).toLocaleString('en-IN')}</p>
        </div>
      </div>
      <div className="grid-2">
        <div className="card detail-card">
          <h4 style={{ marginTop: 0 }}>Stations</h4>
          <ul>
            {vendorStations.map((station) => (
              <li key={station.id}>{station.name} ({station.deviceCount} devices)</li>
            ))}
          </ul>
        </div>
        <div className="card detail-card">
          <h4 style={{ marginTop: 0 }}>Devices</h4>
          <ul>
            {vendorDevices.map((device) => (
              <li key={device.id}>{device.id} - {device.status}</li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}
