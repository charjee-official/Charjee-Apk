import { Injectable, TooManyRequestsException } from '@nestjs/common';
import { RedisService } from '../database/redis.service';
import { SmsService } from './sms.service';

@Injectable()
export class OtpService {
  constructor(
    private readonly redisService: RedisService,
    private readonly smsService: SmsService,
  ) {}

  async issueOtp(phone: string) {
    await this.enforceRateLimit(phone);
    const otp = this.generateOtp();
    const ttlSeconds = Number(process.env.OTP_TTL_SECONDS ?? 300);
    const ttl = Number.isFinite(ttlSeconds) ? ttlSeconds : 300;
    const client = this.redisService.getClient();
    await client.set(this.key(phone), otp, 'EX', ttl);
    await this.smsService.sendOtp(phone, otp);
    return otp;
  }

  async verifyOtp(phone: string, otp: string) {
    const client = this.redisService.getClient();
    const stored = await client.get(this.key(phone));
    if (!stored || stored !== otp) {
      return false;
    }

    await client.del(this.key(phone));
    return true;
  }

  private key(phone: string) {
    return `otp:phone:${phone}`;
  }

  private generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async enforceRateLimit(phone: string) {
    const maxPerWindow = Number(process.env.OTP_MAX_PER_WINDOW ?? 3);
    const windowSeconds = Number(process.env.OTP_WINDOW_SECONDS ?? 300);
    const max = Number.isFinite(maxPerWindow) ? maxPerWindow : 3;
    const window = Number.isFinite(windowSeconds) ? windowSeconds : 300;
    const client = this.redisService.getClient();
    const key = `otp:rate:${phone}`;
    const count = await client.incr(key);
    if (count === 1) {
      await client.expire(key, window);
    }
    if (count > max) {
      throw new TooManyRequestsException('OTP rate limit exceeded');
    }
  }
}
