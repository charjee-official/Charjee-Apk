"use client";

import Link from 'next/link';
import { useCallback } from 'react';
import { Section } from '../../../../components/Section';
import { Table } from '../../../../components/Table';
import { StatusPill } from '../../../../components/StatusPill';
import { fetchSessionHistory } from '../../../../lib/api';
import { formatDateTimeValue } from '../../../../lib/dateTime';
import { sessionHistory } from '../../../../lib/mockData';
import { useAdminData } from '../../../../lib/useAdminData';

export default function SessionHistoryPage() {
  const load = useCallback(() => fetchSessionHistory(), []);
  const { data } = useAdminData(load, sessionHistory);

  return (
    <Section title="Session History" subtitle="Auditable charging sessions">
      <Table
        headings={["Session", "Device", "User", "Started At", "Ended At", "Energy", "Cost", "Close Reason", "Status", "Actions"]}
        rows={data.map((session) => [
          <strong key={session.id}>{session.id}</strong>,
          session.deviceId,
          session.user,
          formatDateTimeValue(session.startedAt ?? session.startTime),
          formatDateTimeValue(session.endedAt),
          `${session.energyKwh} kWh`,
          `INR ${session.cost}`,
          session.closeReason ?? '-',
          <StatusPill key={`${session.id}-status`} value={session.status} />,
          <Link key={`${session.id}-link`} href={`/sessions/${session.id}`}>View</Link>,
        ])}
      />
    </Section>
  );
}
