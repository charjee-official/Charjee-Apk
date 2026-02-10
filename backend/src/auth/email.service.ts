import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  async sendOtp(email: string, otp: string) {
    const provider = (process.env.EMAIL_OTP_PROVIDER ?? 'log').toLowerCase();
    if (provider === 'resend') {
      await this.sendWithResend(email, otp);
      return;
    }

    this.logger.warn(`Email provider not configured. OTP for ${email}: ${otp}`);
  }

  private async sendWithResend(email: string, otp: string) {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_OTP_FROM;
    if (!apiKey || !from) {
      this.logger.warn('RESEND_API_KEY or EMAIL_OTP_FROM is not set. OTP not sent.');
      return;
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [email],
        subject: 'Your vendor login OTP',
        text: `Your OTP is ${otp}. It expires soon.`,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      this.logger.warn(`Resend error: ${response.status} ${text}`);
    }
  }
}
