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

    const payload = {
      sub: user.userId,
      loginId: user.loginId,
      role: user.role,
    };
    const accessToken = this.jwtService.sign(payload);

    // Store token hash
    await this.storeToken(user.userId, accessToken);

    return {
      accessToken,
      user: {
        userId: user.userId,
        loginId: user.loginId,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByLoginId(loginDto.loginId);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user.userId,
      loginId: user.loginId,
      role: user.role,
    };
    const accessToken = this.jwtService.sign(payload);

    // Store token hash
    await this.storeToken(user.userId, accessToken);

    return {
      accessToken,
      user: {
        userId: user.userId,
        loginId: user.loginId,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async validateUser(userId: string) {
    return await this.usersService.findOne(userId);
  }

  async revokeToken(tokenHash: string): Promise<void> {
    const token = await this.tokenRepository.findOne({
      where: { tokenHash },
    });

    if (token) {
      token.isRevoked = true;
      await this.tokenRepository.save(token);
    }
  }

  async isTokenRevoked(tokenHash: string): Promise<boolean> {
    const token = await this.tokenRepository.findOne({
      where: { tokenHash },
    });

    return token?.isRevoked ?? false;
  }

  private async storeToken(userId: string, token: string): Promise<void> {
    const tokenHash = await bcrypt.hash(token, 10);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours expiry

    const userToken = this.tokenRepository.create({
      userId,
      tokenHash,
      expiresAt,
    });

    await this.tokenRepository.save(userToken);
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
