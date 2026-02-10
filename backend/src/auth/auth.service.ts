import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthRepository } from './auth.repository';
import { EmailOtpService } from './email-otp.service';
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
    private readonly emailOtpService: EmailOtpService,
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

  async verifyOtpOnly(phone: string, otp: string) {
    return this.otpService.verifyOtp(phone, otp);
  }

  async requestEmailOtp(email: string) {
    await this.emailOtpService.issueOtp(email);
    return { sent: true };
  }

  async verifyEmailOtp(email: string, otp: string) {
    return this.emailOtpService.verifyOtp(email, otp);
  }

  async registerPassword(username: string, password: string, role: UserRole, subjectId: string) {
    const hash = await bcrypt.hash(password, 10);
    await this.authRepository.createCredential(username, hash, role, subjectId);
    return { ok: true };
  }

  async loginPassword(username: string, password: string) {
    const credential = await this.verifyPassword(username, password);
    if (!credential) {
      throw new UnauthorizedException();
    }

    const payload: JwtPayload = {
      sub: credential.subjectId,
      role: credential.role,
      vendorId: credential.role === 'vendor' ? credential.subjectId : undefined,
    };

    return this.signToken(payload);
  }

  async verifyPassword(username: string, password: string) {
    const credential = await this.authRepository.getCredentialByUsername(username);
    if (!credential) {
      return null;
    }

    const matches = await bcrypt.compare(password, credential.password_hash);
    if (!matches) {
      return null;
    }

    return {
      role: credential.role,
      subjectId: credential.subject_id,
    };
  }

  async getCredentialByUsername(username: string) {
    return this.authRepository.getCredentialByUsername(username);
  }

  async updatePassword(username: string, newPassword: string) {
    const hash = await bcrypt.hash(newPassword, 10);
    await this.authRepository.updateCredentialPassword(username, hash);
    return { ok: true };
  }

  async getOauthIdentity(provider: string, providerUserId: string) {
    return this.authRepository.getOauthIdentity(provider, providerUserId);
  }

  async createOauthIdentity(params: {
    id: string;
    role: UserRole;
    subjectId: string;
    provider: string;
    providerUserId: string;
    email?: string | null;
    displayName?: string | null;
  }) {
    await this.authRepository.createOauthIdentity(params);
  }
}
