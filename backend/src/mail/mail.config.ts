import { registerAs } from '@nestjs/config';

export default registerAs('mail', () => ({
  transport: {
    host: process.env.MAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.MAIL_PORT || '587', 10),
    secure: process.env.MAIL_SECURE === 'true',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASSWORD,
    },
  },
  defaults: {
    from: `"${process.env.MAIL_FROM_NAME || 'RT-MART'}" <${process.env.MAIL_FROM || process.env.MAIL_USER}>`,
  },
  dailyLimit: parseInt(process.env.MAIL_DAILY_LIMIT || '500', 10),
  verification: {
    expiryMinutes: parseInt(
      process.env.EMAIL_VERIFICATION_EXPIRY_MINUTES || '5',
      10,
    ),
    codeLength: parseInt(process.env.EMAIL_VERIFICATION_CODE_LENGTH || '6', 10),
    rateLimit: parseInt(process.env.EMAIL_VERIFICATION_RATE_LIMIT || '3', 10),
  },
}));
