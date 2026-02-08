import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { DatabaseModule } from '../../database/database.module';
import { DevicesModule } from '../devices/devices.module';
import { StationsModule } from '../stations/stations.module';
import { UsersModule } from '../users/users.module';
import { VendorsController } from './vendors.controller';
import { VendorsPortalController } from './vendors.portal.controller';
import { VendorsOnboardingController } from './vendors.onboarding.controller';
import { VendorsRepository } from './vendors.repository';
import { VendorsPortalRepository } from './vendors.portal.repository';
import { VendorsPortalService } from './vendors.portal.service';
import { VendorsService } from './vendors.service';

@Module({
  imports: [DatabaseModule, AuthModule, StationsModule, DevicesModule, UsersModule],
  controllers: [VendorsController, VendorsOnboardingController, VendorsPortalController],
  providers: [
    VendorsRepository,
    VendorsService,
    VendorsPortalRepository,
    VendorsPortalService,
  ],
  exports: [VendorsService],
})
export class VendorsModule {}
