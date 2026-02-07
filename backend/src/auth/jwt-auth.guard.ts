import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthService, JwtPayload } from './auth.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const header: string | undefined = request.headers?.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return false;
    }

    const token = header.slice(7);
    const payload = this.authService.verifyToken(token);
    if (!payload) {
      return false;
    }

    request.user = payload;
    return true;
  }
}
