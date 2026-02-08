import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis, { RedisOptions } from 'ioredis';

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
      const isTls = url.startsWith('rediss://');
      const options: RedisOptions = {
        enableReadyCheck: false,
        maxRetriesPerRequest: null,
      };
      if (isTls) {
        const hostname = new URL(url).hostname;
        options.tls = { servername: hostname };
      }

      this.client = new Redis(url, options);
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
