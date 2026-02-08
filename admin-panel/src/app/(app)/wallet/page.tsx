"use client";

import { useCallback } from 'react';
import { Section } from '../../../components/Section';
import { Table } from '../../../components/Table';
import { fetchWalletTransactions } from '../../../lib/api';
import { walletTxns } from '../../../lib/mockData';
import { useAdminData } from '../../../lib/useAdminData';

export default function WalletPage() {
  const load = useCallback(() => fetchWalletTransactions(), []);
  const { data } = useAdminData(load, walletTxns);

  return (
    <Section title="Wallet & Refunds" subtitle="User wallet transactions">
      <Table
        headings={["Txn", "User", "Session", "Amount", "Type", "Reason"]}
        rows={data.map((txn) => [
          txn.id,
          txn.user,
          txn.sessionId,
          `INR ${txn.amount}`,
          txn.type,
          txn.reason,
        ])}
      />
    </Section>
  );
}
