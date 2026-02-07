import { Module } from '@nestjs/common';
import { PostgresService } from './postgres.service';
import { RedisService } from './redis.service';

@Module({
  providers: [PostgresService, RedisService],
  exports: [PostgresService, RedisService],
})
export class DatabaseModule {}
