"use client";

import Link from 'next/link';
import { useCallback } from 'react';
import { Section } from '../../../components/Section';
import { StatusPill } from '../../../components/StatusPill';
import { Table } from '../../../components/Table';
import { fetchStations } from '../../../lib/api';
import { stations } from '../../../lib/mockData';
import { useAdminData } from '../../../lib/useAdminData';

export default function StationsPage() {
  const load = useCallback(() => fetchStations(), []);
  const { data } = useAdminData(load, stations);

  return (
    <Section title="Stations" subtitle="All charging station hubs">
      <Table
        headings={["Station", "Vendor", "Status", "Devices", "Actions"]}
        rows={data.map((station) => [
          <strong key={station.id}>{station.name}</strong>,
          station.vendorId,
          <StatusPill key={`${station.id}-status`} value={station.status} />,
          station.deviceCount,
          <Link key={`${station.id}-link`} href={`/stations/${station.id}`}>View</Link>,
        ])}
      />
    </Section>
  );
}
