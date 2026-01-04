import {
  Injectable,
  Logger,
  Inject,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';
import mailConfig from './mail.config';
import { EmailOptions } from './interfaces/email-options.interface';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;
  private templates: Map<string, handlebars.TemplateDelegate> = new Map();
  private emailsSentToday = 0;
  private lastResetDate = new Date();

  constructor(
    @Inject(mailConfig.KEY)
    private config: ConfigType<typeof mailConfig>,
  ) {
    this.initializeTransporter();
    this.compileTemplates();
  }

  private initializeTransporter(): void {
    try {
      this.transporter = nodemailer.createTransport(this.config.transport);
      this.logger.log('Mail transporter initialized successfully');
    } catch (error) {
      this.logger.error(
        `Failed to initialize mail transporter: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private compileTemplates(): void {
    const templatesDir = path.join(__dirname, 'templates');
    const layoutPath = path.join(templatesDir, 'layouts', 'base.hbs');

    try {
      // Register base layout
      if (fs.existsSync(layoutPath)) {
        const layoutContent = fs.readFileSync(layoutPath, 'utf-8');
        handlebars.registerPartial('layout', layoutContent);
      }

      // Compile all template files
      const templateFiles = [
        'verification-code.hbs',
        'user-suspended.hbs',
        'store-suspended.hbs',
        'order-cancelled-buyer.hbs',
        'order-cancelled-seller.hbs',
        'seller-application-rejected.hbs',
      ];

      for (const templateFile of templateFiles) {
        const templatePath = path.join(templatesDir, templateFile);
        if (fs.existsSync(templatePath)) {
          const templateContent = fs.readFileSync(templatePath, 'utf-8');
          const templateName = templateFile.replace('.hbs', '');
          this.templates.set(templateName, handlebars.compile(templateContent));
          this.logger.log(`Template compiled: ${templateName}`);
        } else {
          this.logger.warn(`Template not found: ${templateFile}`);
        }
      }
    } catch (error) {
      this.logger.error(
        `Failed to compile templates: ${error.message}`,
        error.stack,
      );
    }
  }

  private checkRateLimit(): void {
    if (this.emailsSentToday >= this.config.dailyLimit) {
      this.logger.error(
        `Daily email limit reached: ${this.emailsSentToday}/${this.config.dailyLimit}`,
      );
      throw new ServiceUnavailableException(
        'Email service temporarily unavailable. Please try again later.',
      );
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  resetDailyCounter(): void {
    this.logger.log(
      `Resetting daily email counter. Sent today: ${this.emailsSentToday}`,
    );
    this.emailsSentToday = 0;
    this.lastResetDate = new Date();
  }

  async sendMail(
    to: string | string[],
    subject: string,
    templateName: string,
    context: Record<string, any>,
  ): Promise<void> {
    try {
      this.checkRateLimit();

      const template = this.templates.get(templateName);
      if (!template) {
        throw new Error(`Template not found: ${templateName}`);
      }

      const html = template(context);
      const recipients = Array.isArray(to) ? to.join(', ') : to;

      const mailOptions = {
        from: this.config.defaults.from,
        to: recipients,
        subject,
        html,
      };

      await this.transporter.sendMail(mailOptions);
      this.emailsSentToday++;

      this.logger.log(
        `Email sent successfully: ${subject} to ${recipients} (${this.emailsSentToday}/${this.config.dailyLimit} today)`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send email: ${subject} to ${to}. Error: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async sendVerificationCode(
    email: string,
    code: string,
    expiryMinutes: number,
  ): Promise<void> {
    if (process.env.NODE_ENV === 'development') {
      this.logger.log(
        `驗證碼 for ${email}: ${code} (有效期 ${expiryMinutes} 分鐘)`,
      );
      console.log('\n=================================');
      console.log(`EMAIL VERIFICATION CODE`);
      console.log(`Email: ${email}`);
      console.log(`Code: ${code}`);
      console.log(`Expires in: ${expiryMinutes} minutes`);
      console.log('=================================\n');
    }
    try {
      await this.sendMail(
        email,
        'Email Verification Code - RT-MART',
        'verification-code',
        {
          code,
          expiryMinutes,
          email,
        },
      );
      this.logger.log(`✅ Verification email sent successfully to ${email}`);
    } catch (error) {
      this.logger.error(
        `❌ Failed to send verification email to ${email}: ${error.message}`,
        error.stack,
      );

      // In development, don't throw error - code is already logged to console
      if (process.env.NODE_ENV === 'development') {
        this.logger.warn(
          '⚠️  Email sending failed, but continuing in development mode. Use the code from console above.',
        );
        return; // Don't throw in development
      }

      // In production, throw error
      throw error;
    }
  }

  async sendUserSuspensionEmail(
    email: string,
    name: string,
    reason: string,
    expiresAt?: Date,
  ): Promise<void> {
    await this.sendMail(
      email,
      'Account Suspension Notice - RT-MART',
      'user-suspended',
      {
        name,
        reason,
        expiresAt,
        isPermanent: !expiresAt,
      },
    );
  }

  async sendStoreSuspensionEmail(
    email: string,
    storeName: string,
    reason: string,
    expiresAt?: Date,
  ): Promise<void> {
    await this.sendMail(
      email,
      'Store Suspension Notice - RT-MART',
      'store-suspended',
      {
        storeName,
        reason,
        expiresAt,
        isPermanent: !expiresAt,
      },
    );
  }

  async sendSellerApplicationRejection(
    email: string,
    name: string,
    reason: string,
  ): Promise<void> {
    await this.sendMail(
      email,
      'Seller Application Review Result - RT-MART',
      'seller-application-rejected',
      {
        name,
        reason,
      },
    );
  }

  async sendOrderCancelledToBuyer(
    email: string,
    orderNumber: string,
    orderDetails: any,
    reason: string,
  ): Promise<void> {
    await this.sendMail(
      email,
      `Order ${orderNumber} Cancelled - RT-MART`,
      'order-cancelled-buyer',
      {
        orderNumber,
        orderDetails,
        reason,
      },
    );
  }

  async sendOrderCancelledToSeller(
    email: string,
    orderNumber: string,
    orderDetails: any,
    reason: string,
  ): Promise<void> {
    await this.sendMail(
      email,
      `Order ${orderNumber} Cancelled - RT-MART`,
      'order-cancelled-seller',
      {
        orderNumber,
        orderDetails,
        reason,
      },
    );
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      this.logger.log('SMTP connection verified successfully');
      return true;
    } catch (error) {
      this.logger.error(
        `SMTP connection verification failed: ${error.message}`,
        error.stack,
      );
      return false;
    }
  }
}
