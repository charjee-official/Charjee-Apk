import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';
import { StartSessionDto } from './dto/start-session.dto';
import { StopSessionDto } from './dto/stop-session.dto';
import { SessionsOrchestrator } from './sessions.orchestrator';

@Controller('sessions')
export class SessionsController {
  constructor(private readonly orchestrator: SessionsOrchestrator) {}

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
}
