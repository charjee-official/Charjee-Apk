import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { RedisService } from '../database/redis.service';
import { EmailService } from './email.service';

@Injectable()
export class EmailOtpService {
  constructor(
    private readonly redisService: RedisService,
    private readonly emailService: EmailService,
  ) {}

  async issueOtp(email: string) {
    await this.enforceRateLimit(email);
    const otp = this.generateOtp();
    const expiryMinutes = Number(process.env.OTP_EXPIRY_MINUTES ?? 5);
    const fallbackTtl = Number.isFinite(expiryMinutes) ? expiryMinutes * 60 : 300;
    const ttlSeconds = Number(process.env.EMAIL_OTP_TTL_SECONDS ?? fallbackTtl);
    const ttl = Number.isFinite(ttlSeconds) ? ttlSeconds : 300;
    const client = this.redisService.getClient();
    await client.set(this.key(email), otp, 'EX', ttl);
    await this.emailService.sendOtp(email, otp);
    return otp;
  }

  async verifyOtp(email: string, otp: string) {
    const client = this.redisService.getClient();
    const stored = await client.get(this.key(email));
    if (!stored || stored !== otp) {
      return false;
    }

    await client.del(this.key(email));
    return true;
  }

  private key(email: string) {
    return `otp:email:${email.toLowerCase()}`;
  }

  private generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async enforceRateLimit(email: string) {
    const maxPerWindow = Number(process.env.OTP_MAX_PER_WINDOW ?? 3);
    const windowSeconds = Number(process.env.OTP_WINDOW_SECONDS ?? 300);
    const max = Number.isFinite(maxPerWindow) ? maxPerWindow : 3;
    const window = Number.isFinite(windowSeconds) ? windowSeconds : 300;
    const client = this.redisService.getClient();
    const key = `otp:rate:email:${email.toLowerCase()}`;
    const count = await client.incr(key);
    if (count === 1) {
      await client.expire(key, window);
    }
    if (count > max) {
      throw new HttpException('OTP rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS);
    }
  }
}
