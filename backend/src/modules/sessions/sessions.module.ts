import { forwardRef, Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { MqttModule } from '../../mqtt/mqtt.module';
import { RealtimeModule } from '../../realtime/realtime.module';
import { BookingsModule } from '../bookings/bookings.module';
import { PricingModule } from '../pricing/pricing.module';
import { WalletModule } from '../wallet/wallet.module';
import { BillingService } from './billing.service';
import { SessionsController } from './sessions.controller';
import { SessionsOrchestrator } from './sessions.orchestrator';
import { SessionsRepository } from './sessions.repository';
import { SessionsService } from './sessions.service';

@Module({
  imports: [
    DatabaseModule,
    BookingsModule,
    PricingModule,
    WalletModule,
    forwardRef(() => MqttModule),
    RealtimeModule,
  ],
  controllers: [SessionsController],
  providers: [BillingService, SessionsService, SessionsOrchestrator, SessionsRepository],
  exports: [SessionsService, SessionsOrchestrator],
})
export class SessionsModule {}
