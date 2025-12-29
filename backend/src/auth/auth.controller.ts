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
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthTokenResponseDto } from './dto/auth-response.dto';
import { plainToInstance } from 'class-transformer';
import { JwtAccessGuard, JwtRefreshGuard } from './guards/jwt-auth.guard';
import type { AuthRequest, CookieRequest } from '../common/types/request.types';

@Controller('auth')
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  //User register: sign up with loginId, name, password, email (phone optional)
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    const result = await this.authService.register(registerDto);
    return result;
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
