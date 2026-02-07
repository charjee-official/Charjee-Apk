import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { StationsController } from './stations.controller';
import { StationsRepository } from './stations.repository';
import { StationsService } from './stations.service';

@Module({
  imports: [DatabaseModule],
  controllers: [StationsController],
  providers: [StationsRepository, StationsService],
  exports: [StationsService],
})
export class StationsModule {}
