import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  ClassSerializerInterceptor,
  Get,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto, AuthTokenResponseDto } from './dto/auth-response.dto';
import { plainToInstance } from 'class-transformer';
import { JwtAccessGuard, JwtRefreshGuard } from './guards/jwt-auth.guard';
import type { AuthRequest } from '../common/types';

@Controller('auth')
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    const result = await this.authService.register(registerDto);
    return plainToInstance(AuthTokenResponseDto, result);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const result = await this.authService.login(loginDto);
    return plainToInstance(AuthTokenResponseDto, result);
  }

  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  async refreshToken(@Req() req: AuthRequest) {
    const user = req.user;
    const result = await this.authService.refreshTokens(user.userId, req.headers.authorization?.replace('Bearer ', '') || '');
    return plainToInstance(AuthTokenResponseDto, result);
  }

  @UseGuards(JwtAccessGuard)
  @Get('profile')
  getProfile(@Req() req: AuthRequest) {
    return req.user;
  }

  @UseGuards(JwtAccessGuard)
  @Post('logout')
  async logout(@Req() req: AuthRequest) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      await this.authService.revokeToken(token);
    }
    return { message: 'Logged out successfully' };
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
