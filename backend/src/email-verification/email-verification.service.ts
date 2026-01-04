import {
  Injectable,
  Logger,
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import type { ConfigType } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import {
  EmailVerification,
  VerificationPurpose,
} from './entities/email-verification.entity';
import { SendVerificationCodeDto } from './dto/send-verification-code.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';
import { MailService } from '../mail/mail.service';
import { UsersService } from '../users/users.service';
import mailConfig from '../mail/mail.config';

@Injectable()
export class EmailVerificationService {
  private readonly logger = new Logger(EmailVerificationService.name);

  constructor(
    @InjectRepository(EmailVerification)
    private readonly verificationRepository: Repository<EmailVerification>,
    private readonly mailService: MailService,
    private readonly usersService: UsersService,
    @Inject(mailConfig.KEY)
    private config: ConfigType<typeof mailConfig>,
  ) {}

  private generateCode(): string {
    const codeLength = this.config.verification.codeLength;
    const min = Math.pow(10, codeLength - 1);
    const max = Math.pow(10, codeLength) - 1;
    return crypto.randomInt(min, max + 1).toString();
  }

  async sendVerificationCode(
    sendCodeDto: SendVerificationCodeDto,
  ): Promise<{ message: string }> {
    const { email, loginId, password, name, phoneNumber, purpose } = sendCodeDto;

    // Check if email or loginId already exists in the User table
    const existingUserByEmail = await this.usersService.findByEmail(email);
    const existingUserByLoginId = await this.usersService.findByLoginId(loginId);

    if (existingUserByEmail || existingUserByLoginId) {
      if (existingUserByLoginId) {
        throw new ConflictException('Login ID already exists');
      }
      throw new ConflictException('Email already exists');
    }

    // Check rate limiting (max 3 codes per hour per email)
    const oneHourAgo = new Date(Date.now() - 3600000);
    const recentCodes = await this.verificationRepository.count({
      where: {
        email,
        createdAt: MoreThan(oneHourAgo),
      },
    });

    if (recentCodes >= this.config.verification.rateLimit) {
      throw new HttpException(
        `Too many verification attempts. Please try again in 1 hour.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Generate verification code
    const code = this.generateCode();
    const codeHash = await bcrypt.hash(code, 10);

    // Hash password before storing (security: never store plaintext password)
    const passwordHash = await bcrypt.hash(password, 10);

    // Calculate expiry time
    const expiresAt = new Date(
      Date.now() + this.config.verification.expiryMinutes * 60000,
    );

    // Store verification record with registration metadata
    const verification = this.verificationRepository.create({
      email,
      codeHash,
      purpose: purpose || VerificationPurpose.REGISTRATION,
      metadata: {
        loginId,
        passwordHash, // Store hashed password, not plaintext
        name,
        phoneNumber,
      },
      expiresAt,
      isUsed: false,
    });

    await this.verificationRepository.save(verification);

    // Send verification email
    try {
      await this.mailService.sendVerificationCode(
        email,
        code,
        this.config.verification.expiryMinutes,
      );
      this.logger.log(`Verification code sent to ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send verification email to ${email}: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Failed to send verification email');
    }

    return {
      message: `Verification code sent to ${email}. Valid for ${this.config.verification.expiryMinutes} minutes.`,
    };
  }

  async verifyCode(verifyDto: VerifyCodeDto): Promise<any> {
    const { email, code } = verifyDto;

    // Find valid verification records
    const verifications = await this.verificationRepository.find({
      where: {
        email,
        isUsed: false,
        expiresAt: MoreThan(new Date()),
      },
      order: {
        createdAt: 'DESC',
      },
    });

    if (!verifications || verifications.length === 0) {
      throw new BadRequestException(
        'No valid verification code found or code has expired',
      );
    }

    // Try to match the code with any valid verification
    for (const verification of verifications) {
      const isMatch = await bcrypt.compare(code, verification.codeHash);

      if (isMatch) {
        // Mark as used
        verification.isUsed = true;
        await this.verificationRepository.save(verification);

        this.logger.log(`Verification successful for ${email}`);

        // Return the stored metadata (registration data)
        return {
          email: verification.email,
          metadata: verification.metadata,
          purpose: verification.purpose,
        };
      }
    }

    throw new BadRequestException('Invalid verification code');
  }

  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredCodes(): Promise<void> {
    try {
      const result = await this.verificationRepository.delete({
        expiresAt: LessThan(new Date()),
      });

      if (result.affected && result.affected > 0) {
        this.logger.log(`Cleaned up ${result.affected} expired verification codes`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to cleanup expired codes: ${error.message}`,
        error.stack,
      );
    }
  }

  async resendVerificationCode(email: string): Promise<{ message: string }> {
    // Find the most recent verification for this email
    const latestVerification = await this.verificationRepository.findOne({
      where: {
        email,
        isUsed: false,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    if (!latestVerification) {
      throw new BadRequestException(
        'No pending verification found for this email',
      );
    }

    if (!latestVerification.metadata) {
      throw new BadRequestException(
        'Registration data not found. Please start registration again.',
      );
    }

    // Reuse the metadata to send a new code
    const sendCodeDto: SendVerificationCodeDto = {
      email: latestVerification.email,
      loginId: latestVerification.metadata.loginId,
      password: latestVerification.metadata.password,
      name: latestVerification.metadata.name,
      phoneNumber: latestVerification.metadata.phoneNumber,
      purpose: latestVerification.purpose,
    };

    return this.sendVerificationCode(sendCodeDto);
  }
}
