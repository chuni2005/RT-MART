import { registerAs } from '@nestjs/config';

export default registerAs('mail', () => {
  const port = parseInt(process.env.MAIL_PORT || '587', 10);

  return {
    transport: {
      host: process.env.MAIL_HOST || 'smtp.gmail.com',
      port,
      // Auto-determine secure based on port (587=STARTTLS, 465=TLS)
      secure: port === 465,
      // Force STARTTLS for port 587
      requireTLS: port === 587,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD,
      },
      // Timeout settings
      connectionTimeout: 60000, // 60 seconds
      greetingTimeout: 30000, // 30 seconds
      socketTimeout: 60000, // 60 seconds
      // Connection pool for better performance
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      // Debug logging (can be disabled in production)
      logger: process.env.NODE_ENV === 'development',
      debug: process.env.NODE_ENV === 'development',
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
      codeLength: parseInt(
        process.env.EMAIL_VERIFICATION_CODE_LENGTH || '6',
        10,
      ),
      rateLimit: parseInt(process.env.EMAIL_VERIFICATION_RATE_LIMIT || '3', 10),
    },
  };
});
