"use client";

import { useCallback } from 'react';
import { Section } from '../../../components/Section';
import { Table } from '../../../components/Table';
import { fetchFinanceSessions } from '../../../lib/api';
import { sessionHistory } from '../../../lib/mockData';
import { useAdminData } from '../../../lib/useAdminData';

export default function FinancePage() {
  const load = useCallback(() => fetchFinanceSessions(), []);
  const { data } = useAdminData(load, sessionHistory);

  return (
    <Section title="Finance & Revenue" subtitle="Platform margin and vendor earnings">
      <Table
        headings={["Session", "Gross (INR)", "Platform 20%", "Vendor Share"]}
        rows={data.map((session) => {
          const platform = session.cost * 0.2;
          const vendor = session.cost - platform;
          return [
            session.id,
            `INR ${session.cost}`,
            `INR ${platform.toFixed(2)}`,
            `INR ${vendor.toFixed(2)}`,
          ];
        })}
      />
    </Section>
  );
}
