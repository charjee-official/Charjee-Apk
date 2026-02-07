import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;

  getClient(): Redis {
    if (!this.client) {
      const url = process.env.REDIS_URL;
      if (!url) {
        throw new Error('REDIS_URL is not set');
      }
      this.client = new Redis(url);
      this.client.on('error', (err) => {
        this.logger.error(`Redis error: ${err.message}`);
      });
    }

    return this.client;
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
    }
  }
}
