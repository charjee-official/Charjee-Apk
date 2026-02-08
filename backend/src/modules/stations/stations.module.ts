import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { DatabaseModule } from '../../database/database.module';
import { DevicesModule } from '../devices/devices.module';
import { StationsController } from './stations.controller';
import { StationsRepository } from './stations.repository';
import { StationsService } from './stations.service';

@Module({
  imports: [DatabaseModule, AuthModule, DevicesModule],
  controllers: [StationsController],
  providers: [StationsRepository, StationsService],
  exports: [StationsService],
})
export class StationsModule {}
