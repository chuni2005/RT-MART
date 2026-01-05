import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  ClassSerializerInterceptor,
  Get,
  UseGuards,
  Req,
  Res,
  UploadedFile,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthTokenResponseDto } from './dto/auth-response.dto';
import { plainToInstance } from 'class-transformer';
import { JwtAccessGuard, JwtRefreshGuard } from './guards/jwt-auth.guard';
import type { AuthRequest, CookieRequest } from '../common/types/request.types';
import { SendVerificationCodeDto } from '../email-verification/dto/send-verification-code.dto';
import { VerifyCodeDto } from '../email-verification/dto/verify-code.dto';
import { EmailVerificationService } from '../email-verification/email-verification.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Controller('auth')
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly emailVerificationService: EmailVerificationService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  //User register: sign up with loginId, name, password, email (phone optional)
  // DEPRECATED: Use register/send-code and register/verify for email verification
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    const result = await this.authService.register(registerDto);
    return result;
  }

  // Step 1: Send verification code to email
  @Post('register/send-code')
  @UseInterceptors(
    FileInterceptor('avatar', {
      fileFilter: (req, file, cb) => {
        if (file && !file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 2 * 1024 * 1024, // 2MB
      },
    }),
  )
  async sendVerificationCode(
    @Body() sendCodeDto: SendVerificationCodeDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    // If avatar file is uploaded, upload to Cloudinary and get the URL
    if (file) {
      const uploadResult = await this.cloudinaryService.uploadImage(
        file,
        'avatars',
      );
      sendCodeDto.avatarUrl = uploadResult.url;
    }
    
    return this.emailVerificationService.sendVerificationCode(sendCodeDto);
  }

  // Step 2: Verify code and complete registration
  @Post('register/verify')
  async verifyAndRegister(
    @Body() verifyDto: VerifyCodeDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Verify the code and get registration data
    const verificationResult =
      await this.emailVerificationService.verifyCode(verifyDto);

    // Create user account with the stored registration data
    const user = await this.authService.registerWithVerifiedEmail({
      ...verificationResult.metadata,
      email: verificationResult.email,
    });

    // Auto-login: generate tokens for the newly created user
    const loginResult = await this.authService.generateTokensForUser(user);

    // Set cookies
    res.cookie('accessToken', loginResult.accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 1000,
    });

    res.cookie('refreshToken', loginResult.refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000,
    });

    return {
      success: true,
      userId: user.userId,
      ...plainToInstance(AuthTokenResponseDto, loginResult),
    };
  }

  //User login: sign in with loginId and password, return accessToken and refreshToken in httpOnly cookies
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(loginDto);

    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 1000, // 1 hour
    });

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000,
    });
    return plainToInstance(AuthTokenResponseDto, result);
  }

  //Refresh access token: provide refreshToken in httpOnly cookie, return new accessToken in httpOnly cookie
  @Post('refresh')
  async refresh(
    @Req() req: CookieRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies['refreshToken'];
    if (!refreshToken) {
      throw new Error('Refresh token not found');
    }
    const result = await this.authService.refreshTokens(refreshToken);

    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 1000, // 1 hour
    });
    return this.authService.refreshTokens(refreshToken);
  }

  //Get profile: get user profile info by accessToken in httpOnly cookie
  @UseGuards(JwtAccessGuard)
  @Get('profile')
  getProfile(@Req() req: AuthRequest) {
    return req.user;
  }

  //User logout: invalidate refreshToken, clear accessToken and refreshToken cookies
  @UseGuards(JwtRefreshGuard)
  @Post('logout')
  async logout(
    @Req() req: CookieRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies['refreshToken'];
    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }
    res.clearCookie('refreshToken');
    res.clearCookie('accessToken');
    return { success: true };
  }

  @Get('test/health')
  getHealth(): object {
    return {
      status: 'ok',
      module: 'auth',
      timestamp: new Date().toISOString(),
    };
  }
}
