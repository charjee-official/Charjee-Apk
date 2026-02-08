'use client';

import { Section } from '../../../components/Section';
import { Table } from '../../../components/Table';
import { getLoginActivity } from '../../../lib/auth';
import { formatDateTimeValue } from '../../../lib/dateTime';

export default function ActivityPage() {
  const log = getLoginActivity();

  return (
    <Section title="Login Activity" subtitle="Recent admin access">
      <Table
        headings={["Admin", "Time", "Agent"]}
        rows={log.map((entry) => [entry.username, formatDateTimeValue(entry.at), entry.agent])}
      />
    </Section>
  );
}
