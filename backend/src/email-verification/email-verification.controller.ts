import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { EmailVerificationService } from './email-verification.service';
import { SendVerificationCodeDto } from './dto/send-verification-code.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';

@Controller('email-verification')
export class EmailVerificationController {
  constructor(
    private readonly emailVerificationService: EmailVerificationService,
  ) {}

  @Post('send')
  @HttpCode(HttpStatus.OK)
  async sendCode(@Body() sendCodeDto: SendVerificationCodeDto) {
    return this.emailVerificationService.sendVerificationCode(sendCodeDto);
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  async verifyCode(@Body() verifyDto: VerifyCodeDto) {
    return this.emailVerificationService.verifyCode(verifyDto);
  }

  @Post('resend')
  @HttpCode(HttpStatus.OK)
  async resendCode(@Body() body: { email: string }) {
    return this.emailVerificationService.resendVerificationCode(body.email);
  }
}
