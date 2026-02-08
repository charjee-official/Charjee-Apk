import { Injectable } from '@nestjs/common';
import { PostgresService } from '../../database/postgres.service';

export interface WalletTxnRecord {
  id: string;
  userId: string;
  sessionId: string | null;
  amount: number;
  type: string;
  createdAt: Date;
}

@Injectable()
export class WalletRepository {
  constructor(private readonly postgres: PostgresService) {}

  async listTransactions(): Promise<WalletTxnRecord[]> {
    const pool = this.postgres.getPool();
    const result = await pool.query(
      `
      SELECT id, user_id, session_id, amount, type, created_at
      FROM wallet_ledger
      ORDER BY created_at DESC
      `,
    );
    return result.rows.map((row) => ({
      id: String(row.id),
      userId: row.user_id,
      sessionId: row.session_id ?? null,
      amount: Number(row.amount ?? 0),
      type: row.type,
      createdAt: row.created_at,
    }));
  }
}
