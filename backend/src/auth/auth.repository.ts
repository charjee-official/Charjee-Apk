import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PostgresService } from '../database/postgres.service';
import { UserRole } from './auth.service';

@Injectable()
export class AuthRepository {
  private readonly logger = new Logger(AuthRepository.name);

  constructor(private readonly postgres: PostgresService) {}

  async getOrCreateUserByPhone(phone: string): Promise<string> {
    const pool = this.postgres.getPool();
    const existing = await pool.query(
      `SELECT id FROM users WHERE phone=$1 LIMIT 1`,
      [phone],
    );
    if (existing.rowCount > 0) {
      return String(existing.rows[0].id);
    }

    const id = randomUUID();
    try {
      await pool.query(
        `INSERT INTO users (id, phone) VALUES ($1,$2)`,
        [id, phone],
      );
    } catch (error) {
      this.logger.error(`Failed to create user: ${String(error)}`);
    }

    return id;
  }

  async getCredentialByUsername(username: string) {
    const pool = this.postgres.getPool();
    const result = await pool.query(
      `SELECT id, role, subject_id, username, password_hash FROM auth_credentials WHERE username=$1`,
      [username],
    );
    return result.rows[0] as
      | {
          id: string;
          role: UserRole;
          subject_id: string;
          username: string;
          password_hash: string;
        }
      | undefined;
  }

  async createCredential(
    username: string,
    passwordHash: string,
    role: UserRole,
    subjectId: string,
  ) {
    const pool = this.postgres.getPool();
    const id = randomUUID();
    try {
      await pool.query(
        `INSERT INTO auth_credentials (id, role, subject_id, username, password_hash)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (username) DO NOTHING`,
        [id, role, subjectId, username, passwordHash],
      );
      return id;
    } catch (error) {
      this.logger.error(`Failed to create credential: ${String(error)}`);
      return id;
    }
  }
}
