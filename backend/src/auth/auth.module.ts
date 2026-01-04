import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserToken } from './entities/user-token.entity';
import { UsersModule } from '../users/users.module';
import { JwtAccessStrategy } from './strategies/jwt-access.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { EmailVerificationModule } from '../email-verification/email-verification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserToken]),
    UsersModule,
    EmailVerificationModule,
    PassportModule,
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAccessStrategy, JwtRefreshStrategy],
  exports: [AuthService],
})
export class AuthModule {}
