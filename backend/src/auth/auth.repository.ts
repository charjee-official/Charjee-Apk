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
    if ((existing.rowCount ?? 0) > 0) {
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

  async updateCredentialPassword(username: string, passwordHash: string) {
    const pool = this.postgres.getPool();
    await pool.query(
      `UPDATE auth_credentials SET password_hash=$2 WHERE username=$1`,
      [username, passwordHash],
    );
  }

  async getOauthIdentity(provider: string, providerUserId: string) {
    const pool = this.postgres.getPool();
    const result = await pool.query(
      `SELECT id, role, subject_id, provider, provider_user_id, email, display_name
       FROM oauth_identities
       WHERE provider=$1 AND provider_user_id=$2
       LIMIT 1`,
      [provider, providerUserId],
    );
    return result.rows[0] as
      | {
          id: string;
          role: UserRole;
          subject_id: string;
          provider: string;
          provider_user_id: string;
          email: string | null;
          display_name: string | null;
        }
      | undefined;
  }

  async createOauthIdentity(params: {
    id: string;
    role: UserRole;
    subjectId: string;
    provider: string;
    providerUserId: string;
    email?: string | null;
    displayName?: string | null;
  }) {
    const pool = this.postgres.getPool();
    await pool.query(
      `INSERT INTO oauth_identities (id, role, subject_id, provider, provider_user_id, email, display_name)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (provider, provider_user_id) DO NOTHING`,
      [
        params.id,
        params.role,
        params.subjectId,
        params.provider,
        params.providerUserId,
        params.email ?? null,
        params.displayName ?? null,
      ],
    );
  }
}
