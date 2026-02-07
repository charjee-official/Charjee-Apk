import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';

@Injectable()
export class PostgresService implements OnModuleDestroy {
  private readonly logger = new Logger(PostgresService.name);
  private pool: Pool | null = null;

  getPool(): Pool {
    if (!this.pool) {
      const connectionString = process.env.DATABASE_URL;
      if (!connectionString) {
        throw new Error('DATABASE_URL is not set');
      }
      this.pool = new Pool({ connectionString });
      this.pool.on('error', (err) => {
        this.logger.error(`Postgres pool error: ${err.message}`);
      });
    }

    return this.pool;
  }

  async onModuleDestroy() {
    if (this.pool) {
      await this.pool.end();
    }
  }
}
