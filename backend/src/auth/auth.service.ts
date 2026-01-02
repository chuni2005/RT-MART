import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { UserToken } from './entities/user-token.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserRole } from '../users/entities/user.entity';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @InjectRepository(UserToken)
    private readonly tokenRepository: Repository<UserToken>,
  ) {}

  async register(registerDto: RegisterDto) {
    const user = await this.usersService.create({
      ...registerDto,
      role: UserRole.BUYER, // Default role for registration
    });
    return { success: true, userId: user.userId };
  }

  async login(loginDto: LoginDto) {
    // Include suspended users to check suspension status
    const user = await this.usersService.findByLoginId(loginDto.loginId, true);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user account is suspended
    if (user.deletedAt) {
      throw new UnauthorizedException('Account has been suspended');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = this.jwtService.sign(
      {
        sub: user.userId,
        loginId: user.loginId,
        role: user.role,
      },
      {
        expiresIn: '15m',
        secret: process.env.ACCESS_SECRET,
      },
    );

    const refreshToken = this.jwtService.sign(
      {
        sub: user.userId,
        loginId: user.loginId,
        role: user.role,
      },
      {
        expiresIn: '1d',
        secret: process.env.REFRESH_SECRET,
      },
    );

    const decoded: JwtPayload | null | string =
      this.jwtService.decode(refreshToken);
    if (!decoded || typeof decoded === 'string') {
      throw new UnauthorizedException('Invalid token format');
    }
    const jwtPayload: JwtPayload = decoded;
    const createdAt = jwtPayload.iat
      ? new Date(jwtPayload.iat * 1000)
      : new Date();

    // Store token hash
    await this.tokenRepository.save({
      userId: user.userId,
      tokenHash: await bcrypt.hash(refreshToken, 10),
      createdAt,
      expiresAt: jwtPayload.exp
        ? new Date(jwtPayload.exp * 1000)
        : new Date(Date.now() + 24 * 60 * 60 * 1000),
      isRevoked: false,
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  async refreshTokens(refreshToken: string) {
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: process.env.REFRESH_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const userId = payload.sub;
    const createdAt = payload.iat ? new Date(payload.iat * 1000) : new Date();

    const tokenEntity = await this.tokenRepository.findOne({
      where: { userId, createdAt },
    });

    if (!tokenEntity) throw new UnauthorizedException('Token not found');
    if (tokenEntity.expiresAt < new Date())
      throw new UnauthorizedException('Token expired');
    if (tokenEntity.isRevoked) throw new UnauthorizedException('Token revoked');

    const isValid = await bcrypt.compare(refreshToken, tokenEntity.tokenHash);
    if (!isValid) throw new UnauthorizedException('Token mismatch');

    const newAccessToken = this.jwtService.sign(
      { sub: userId, role: payload.role, loginId: payload.loginId },
      { secret: process.env.ACCESS_SECRET, expiresIn: '15m' },
    );

    return { accessToken: newAccessToken };
  }

  async logout(refreshToken: string): Promise<void> {
    await this.revokeToken(refreshToken);
  }

  async revokeToken(refreshToken: string): Promise<void> {
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: process.env.REFRESH_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const userId = payload.sub;
    const createdAt = payload.iat ? new Date(payload.iat * 1000) : new Date();

    const tokenEntity = await this.tokenRepository.findOne({
      where: { userId, createdAt },
    });
    if (tokenEntity) {
      tokenEntity.isRevoked = true;
      await this.tokenRepository.save(tokenEntity);
    }
  }

  /**
   * 定時清理過期的 token
   * 每天凌晨 2:00 執行
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async cleanupExpiredTokens(): Promise<void> {
    try {
      const result = await this.tokenRepository.delete({
        expiresAt: LessThan(new Date()),
      });

      this.logger.log(
        `Successfully cleaned up ${result.affected || 0} expired tokens`,
      );
    } catch (error) {
      this.logger.error('Failed to cleanup expired tokens', error);
    }
  }

  /**
   * 清理已撤銷且過期的 token（更激進的清理）
   * 每週日凌晨 3:00 執行
   */
  @Cron('0 3 * * 0')
  async cleanupRevokedTokens(): Promise<void> {
    try {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const result = await this.tokenRepository.delete({
        isRevoked: true,
        createdAt: LessThan(oneWeekAgo),
      });

      this.logger.log(
        `Successfully cleaned up ${result.affected || 0} old revoked tokens`,
      );
    } catch (error) {
      this.logger.error('Failed to cleanup revoked tokens', error);
    }
  }
}
