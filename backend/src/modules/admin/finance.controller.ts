import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';
import { SessionsService } from '../sessions/sessions.service';

@Controller('finance')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class FinanceController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get('sessions')
  listSessions() {
    return this.sessionsService.listFinanceSessions();
  }
}
