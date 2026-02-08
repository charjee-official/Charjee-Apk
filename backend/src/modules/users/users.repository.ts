import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PostgresService } from '../../database/postgres.service';

export interface UserRecord {
  id: string;
  phone: string;
  name: string | null;
  createdAt: Date;
}

@Injectable()
export class UsersRepository {
  private readonly logger = new Logger(UsersRepository.name);

  constructor(private readonly postgres: PostgresService) {}

  async createUser(phone: string, name?: string) {
    const pool = this.postgres.getPool();
    const id = randomUUID();
    try {
      await pool.query(
        `INSERT INTO users (id, phone, name) VALUES ($1,$2,$3)
         ON CONFLICT (phone) DO NOTHING`,
        [id, phone, name ?? null],
      );
    } catch (error) {
      this.logger.error(`Failed to create user: ${String(error)}`);
    }
    return this.getByPhone(phone);
  }

  async listAll(): Promise<UserRecord[]> {
    const pool = this.postgres.getPool();
    const result = await pool.query(
      `SELECT id, phone, name, created_at FROM users ORDER BY created_at DESC`,
    );
    return result.rows.map((row: Record<string, unknown>) => ({
      id: row.id,
      phone: row.phone,
      name: row.name ?? null,
      createdAt: row.created_at,
    }));
  }

  async getByPhone(phone: string): Promise<UserRecord | null> {
    const pool = this.postgres.getPool();
    const result = await pool.query(
      `SELECT id, phone, name, created_at FROM users WHERE phone=$1 LIMIT 1`,
      [phone],
    );
    if (result.rowCount === 0) {
      return null;
    }
    const row = result.rows[0];
    return {
      id: row.id,
      phone: row.phone,
      name: row.name ?? null,
      createdAt: row.created_at,
    };
  }
}
