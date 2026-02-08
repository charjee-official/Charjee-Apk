import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';
import { StartSessionDto } from './dto/start-session.dto';
import { StopSessionDto } from './dto/stop-session.dto';
import { SessionsOrchestrator } from './sessions.orchestrator';
import { SessionsService } from './sessions.service';

@Controller('sessions')
export class SessionsController {
  constructor(
    private readonly orchestrator: SessionsOrchestrator,
    private readonly sessionsService: SessionsService,
  ) {}

  @Post('start')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user')
  async start(@Body() input: StartSessionDto) {
    return this.orchestrator.startSession(input);
  }

  @Post('stop')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user', 'admin')
  stop(@Body() input: StopSessionDto) {
    return this.orchestrator.stopSession(input);
  }

  @Get('active')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  listActive() {
    return this.sessionsService.listActiveSessions();
  }

  @Get('history')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  listHistory() {
    return this.sessionsService.listHistorySessions();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  getById(@Param('id') id: string) {
    return this.sessionsService.getAdminSession(id);
  }

  @Post(':id/force-stop')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  forceStop(@Param('id') id: string) {
    return this.orchestrator.forceStopSession(id);
  }
}
