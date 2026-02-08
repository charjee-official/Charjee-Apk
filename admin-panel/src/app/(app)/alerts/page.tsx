"use client";

import { useCallback } from 'react';
import { Section } from '../../../components/Section';
import { Table } from '../../../components/Table';
import { StatusPill } from '../../../components/StatusPill';
import { fetchAlerts } from '../../../lib/api';
import { formatDateTimeValue } from '../../../lib/dateTime';
import { alerts } from '../../../lib/mockData';
import { useAdminData } from '../../../lib/useAdminData';

export default function AlertsPage() {
  const load = useCallback(() => fetchAlerts(), []);
  const { data } = useAdminData(load, alerts);

  return (
    <Section title="Alerts & Faults" subtitle="Critical system alerts">
      <Table
        headings={["Alert", "Device", "Type", "Status", "Time"]}
        rows={data.map((alert) => [
          alert.id,
          alert.deviceId,
          alert.type,
          <StatusPill key={`${alert.id}-status`} value={alert.status} />,
          formatDateTimeValue(alert.createdAt),
        ])}
      />
    </Section>
  );
}
