"use client";

import Link from 'next/link';
import { useCallback } from 'react';
import { Section } from '../../../components/Section';
import { StatusPill } from '../../../components/StatusPill';
import { Table } from '../../../components/Table';
import { fetchDevices } from '../../../lib/api';
import { devices } from '../../../lib/mockData';
import { useAdminData } from '../../../lib/useAdminData';

export default function DevicesPage() {
  const load = useCallback(() => fetchDevices(), []);
  const { data } = useAdminData(load, devices);

  return (
    <Section title="Devices" subtitle="Live charger monitoring">
      <Table
        headings={["Device", "Station", "Vendor", "Status", "Heartbeat", "Actions"]}
        rows={data.map((device) => [
          <strong key={device.id}>{device.id}</strong>,
          device.stationId,
          device.vendorId,
          <StatusPill key={`${device.id}-status`} value={device.status} />,
          device.lastHeartbeat,
          <Link key={`${device.id}-link`} href={`/devices/${device.id}`}>View</Link>,
        ])}
      />
    </Section>
  );
}
