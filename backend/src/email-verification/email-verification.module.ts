import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { EmailVerificationService } from './email-verification.service';
import { EmailVerificationController } from './email-verification.controller';
import { EmailVerification } from './entities/email-verification.entity';
import { MailModule } from '../mail/mail.module';
import { UsersModule } from '../users/users.module';
import mailConfig from '../mail/mail.config';

@Module({
  imports: [
    TypeOrmModule.forFeature([EmailVerification]),
    ConfigModule.forFeature(mailConfig),
    MailModule,
    UsersModule,
  ],
  controllers: [EmailVerificationController],
  providers: [EmailVerificationService],
  exports: [EmailVerificationService],
})
export class EmailVerificationModule {}
