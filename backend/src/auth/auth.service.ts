import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthRepository } from './auth.repository';
import { OtpService } from './otp.service';

export type UserRole = 'user' | 'vendor' | 'admin';

export interface JwtPayload {
  sub: string;
  role: UserRole;
  vendorId?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly authRepository: AuthRepository,
    private readonly otpService: OtpService,
  ) {}

  signToken(payload: JwtPayload) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not set');
    }

    return {
      accessToken: this.jwtService.sign(payload, {
        secret,
        expiresIn: '12h',
      }),
    };
  }

  verifyToken(token: string): JwtPayload | null {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return null;
    }

    try {
      return this.jwtService.verify<JwtPayload>(token, { secret });
    } catch {
      return null;
    }
  }

  async requestOtp(phone: string) {
    await this.otpService.issueOtp(phone);
    return { sent: true };
  }

  async verifyOtp(phone: string, otp: string) {
    const ok = await this.otpService.verifyOtp(phone, otp);
    if (!ok) {
      throw new UnauthorizedException();
    }

    const userId = await this.authRepository.getOrCreateUserByPhone(phone);
    return this.signToken({ sub: userId, role: 'user' });
  }

  async registerPassword(username: string, password: string, role: UserRole, subjectId: string) {
    const hash = await bcrypt.hash(password, 10);
    await this.authRepository.createCredential(username, hash, role, subjectId);
    return { ok: true };
  }

  async loginPassword(username: string, password: string) {
    const credential = await this.authRepository.getCredentialByUsername(username);
    if (!credential) {
      throw new UnauthorizedException();
    }

    const matches = await bcrypt.compare(password, credential.password_hash);
    if (!matches) {
      throw new UnauthorizedException();
    }

    const payload: JwtPayload = {
      sub: credential.subject_id,
      role: credential.role,
      vendorId: credential.role === 'vendor' ? credential.subject_id : undefined,
    };

    return this.signToken(payload);
  }
}
