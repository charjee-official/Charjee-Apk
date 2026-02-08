import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { DatabaseModule } from '../../database/database.module';
import { SessionsModule } from '../sessions/sessions.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { DashboardController } from './dashboard.controller';
import { FinanceController } from './finance.controller';

@Module({
  imports: [DatabaseModule, AuthModule, SessionsModule],
  controllers: [AdminController, DashboardController, FinanceController],
  providers: [AdminService],
})
export class AdminModule {}
