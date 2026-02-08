import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';
import { WalletService } from './wallet.service';

@Controller('wallet')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('transactions')
  listTransactions() {
    return this.walletService.listTransactions();
  }
}
