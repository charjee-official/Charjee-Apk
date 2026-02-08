"use client";

import Link from 'next/link';
import { useCallback } from 'react';
import { Section } from '../../../components/Section';
import { StatusPill } from '../../../components/StatusPill';
import { Table } from '../../../components/Table';
import { fetchVendors } from '../../../lib/api';
import { vendors } from '../../../lib/mockData';
import { useAdminData } from '../../../lib/useAdminData';

export default function VendorsPage() {
  const load = useCallback(() => fetchVendors(), []);
  const { data } = useAdminData(load, vendors);

  return (
    <Section title="Vendors" subtitle="Manage vendor partners and KYC status">
      <Table
        headings={["Vendor", "KYC", "Status", "Revenue (INR)", "Actions"]}
        rows={data.map((vendor) => [
          <strong key={vendor.id}>{vendor.name}</strong>,
          <StatusPill key={`${vendor.id}-kyc`} value={vendor.kyc} />,
          <StatusPill key={`${vendor.id}-status`} value={vendor.status} />,
          vendor.revenue.toLocaleString('en-IN'),
          <Link key={`${vendor.id}-link`} href={`/vendors/${vendor.id}`}>View</Link>,
        ])}
      />
    </Section>
  );
}
