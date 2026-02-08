"use client";

import Link from 'next/link';
import { useCallback } from 'react';
import { Section } from '../../../../components/Section';
import { Table } from '../../../../components/Table';
import { StatusPill } from '../../../../components/StatusPill';
import { fetchActiveSessions } from '../../../../lib/api';
import { formatDateTimeValue } from '../../../../lib/dateTime';
import { activeSessions } from '../../../../lib/mockData';
import { useAdminData } from '../../../../lib/useAdminData';

export default function ActiveSessionsPage() {
  const load = useCallback(() => fetchActiveSessions(), []);
  const { data } = useAdminData(load, activeSessions);

  return (
    <Section title="Active Sessions" subtitle="Live charging sessions">
      <Table
        headings={["Session", "Device", "User", "Started At", "Energy", "Cost", "Status", "Actions"]}
        rows={data.map((session) => [
          <strong key={session.id}>{session.id}</strong>,
          session.deviceId,
          session.user,
          formatDateTimeValue(session.startedAt ?? session.startTime),
          `${session.energyKwh} kWh`,
          `INR ${session.cost}`,
          <StatusPill key={`${session.id}-status`} value={session.status} />,
          <Link key={`${session.id}-link`} href={`/sessions/${session.id}`}>View</Link>,
        ])}
      />
    </Section>
  );
}
