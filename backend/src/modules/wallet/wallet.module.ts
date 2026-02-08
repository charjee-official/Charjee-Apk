import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { DatabaseModule } from '../../database/database.module';
import { SettingsModule } from '../settings/settings.module';
import { WalletController } from './wallet.controller';
import { WalletRepository } from './wallet.repository';
import { WalletService } from './wallet.service';

@Module({
  imports: [DatabaseModule, AuthModule, SettingsModule],
  controllers: [WalletController],
  providers: [WalletRepository, WalletService],
  exports: [WalletService],
})
export class WalletModule {}
