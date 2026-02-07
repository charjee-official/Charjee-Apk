import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  async sendOtp(phone: string, otp: string) {
    this.logger.log(`OTP issued phone=${phone} otp=${otp}`);
  }
}
