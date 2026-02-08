import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';
import { AlertsService } from './alerts.service';

@Controller('alerts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  listAll() {
    return this.alertsService.listAll();
  }

  @Post(':id/resolve')
  resolve(@Param('id') id: string) {
    return this.alertsService.resolveAlert(id);
  }
}
