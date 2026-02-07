import { Logger } from '@nestjs/common';
import {
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthService, JwtPayload } from '../auth/auth.service';

@WebSocketGateway({ cors: true })
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(RealtimeGateway.name);

  constructor(private readonly authService: AuthService) {}

  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket) {
    const token = this.extractToken(client);
    const payload = token ? this.authService.verifyToken(token) : null;
    if (!payload) {
      this.logger.warn(`WS auth failed clientId=${client.id}`);
      client.disconnect(true);
      return;
    }

    client.data.auth = payload;
    this.logger.log(`WS connected clientId=${client.id} role=${payload.role}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`WS disconnected clientId=${client.id}`);
  }

  @SubscribeMessage('join')
  handleJoin(client: Socket, @MessageBody() rooms: string[]) {
    const payload = client.data.auth as JwtPayload | undefined;
    if (!payload) {
      return { ok: false, reason: 'unauthorized' };
    }

    if (!Array.isArray(rooms)) {
      return { ok: false };
    }

    const allowed = rooms.filter((room) => this.isRoomAllowed(room, payload));
    allowed.forEach((room) => client.join(room));

    return { ok: true, joined: allowed };
  }

  private extractToken(client: Socket): string | undefined {
    const authToken = client.handshake.auth?.token;
    if (typeof authToken === 'string') {
      return authToken;
    }

    const header = client.handshake.headers.authorization;
    if (typeof header === 'string' && header.startsWith('Bearer ')) {
      return header.slice(7);
    }

    return undefined;
  }

  private isRoomAllowed(room: string, payload: JwtPayload): boolean {
    if (payload.role === 'admin') {
      return true;
    }

    if (payload.role === 'user') {
      return room === `user:${payload.sub}`;
    }

    if (payload.role === 'vendor') {
      return Boolean(payload.vendorId) && room === `vendor:${payload.vendorId}`;
    }

    return false;
  }
}
