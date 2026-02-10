import { Module } from '@nestjs/common';
import { PostgresService } from './postgres.service';
import { RedisService } from './redis.service';
import { SupabaseService } from './supabase.service';

@Module({
  providers: [PostgresService, RedisService, SupabaseService],
  exports: [PostgresService, RedisService, SupabaseService],
})
export class DatabaseModule {}
