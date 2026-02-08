import { Injectable, Logger } from '@nestjs/common';
import { request } from 'https';
import { URL } from 'url';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  async sendOtp(phone: string, otp: string) {
    const authKey = process.env.MSG91_AUTH_KEY;
    const templateId = process.env.MSG91_TEMPLATE_ID;
    if (!authKey || !templateId) {
      this.logger.warn('MSG91 credentials not configured. OTP not sent.');
      return;
    }

    const mobile = this.normalizePhone(phone);
    const expiryMinutes = Number(process.env.OTP_EXPIRY_MINUTES ?? 10);
    const otpExpiry = Number.isFinite(expiryMinutes) ? expiryMinutes : 10;
    const senderId = process.env.MSG91_SENDER_ID;

    const url = new URL('https://control.msg91.com/api/v5/otp');
    url.searchParams.set('authkey', authKey);
    url.searchParams.set('template_id', templateId);
    url.searchParams.set('mobile', mobile);
    url.searchParams.set('otp', otp);
    url.searchParams.set('otp_expiry', String(otpExpiry));
    if (senderId) {
      url.searchParams.set('sender', senderId);
    }

    await this.sendRequest(url);
  }

  private normalizePhone(phone: string) {
    const trimmed = phone.trim();
    if (/^\d{10}$/.test(trimmed)) {
      const cc = process.env.MSG91_COUNTRY_CODE ?? '91';
      return `${cc}${trimmed}`;
    }
    return trimmed;
  }

  private sendRequest(url: URL): Promise<void> {
    return new Promise((resolve, reject) => {
      const req = request(url, { method: 'GET' }, (res) => {
        if (!res.statusCode || res.statusCode >= 400) {
          this.logger.warn(`MSG91 response status=${res.statusCode}`);
        }
        res.on('data', () => undefined);
        res.on('end', () => resolve());
      });

      req.on('error', (error) => {
        this.logger.error(`MSG91 request failed: ${error.message}`);
        reject(error);
      });

      req.end();
    });
  }
}
