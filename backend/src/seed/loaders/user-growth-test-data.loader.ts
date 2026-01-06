import { EntityManager } from 'typeorm';
import { Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../../users/entities/user.entity';

/**
 * 專門為 Admin Dashboard 測試產生的用戶增長數據載入器
 * 隨機產生過去一年內註冊的用戶
 */
export class UserGrowthTestDataLoader {
  constructor(
    private entityManager: EntityManager,
    private logger: Logger,
  ) {}

  async load(): Promise<{ success: number; errors: string[] }> {
    this.logger.log('開始產生 Admin Dashboard 用戶增長測試數據...');

    const users: User[] = [];
    const now = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(now.getFullYear() - 1);

    // 產生 500 筆用戶，模擬用戶增長
    const userCount = 600;
    const saltRounds = 10;
    const commonPasswordHash = await bcrypt.hash('password123', saltRounds);

    this.logger.log(`準備產生 ${userCount} 筆用戶資料...`);

    for (let i = 0; i < userCount; i++) {
      // 隨機產生過去一年內的時間
      const randomTime =
        oneYearAgo.getTime() +
        Math.random() * (now.getTime() - oneYearAgo.getTime());
      const registrationDate = new Date(randomTime);

      const user = new User();
      const randomId = Math.floor(Math.random() * 1000000)
        .toString()
        .padStart(6, '0');

      // 符合 CreateUserDto 限制
      user.loginId = `test_user_${randomId}_${i}`;
      user.passwordHash = commonPasswordHash;
      user.name = `測試用戶 ${randomId}`;
      user.email = `test_${randomId}_${i}@example.com`;
      user.avatarUrl = `https://i.pravatar.cc/150?u=${user.loginId}`;
      user.phoneNumber = `09${Math.floor(Math.random() * 100000000)
        .toString()
        .padStart(8, '0')}`;

      // 角色分佈：大部分是買家，少部分是賣家
      const roleRandom = Math.random();
      if (roleRandom < 0.9) {
        user.role = UserRole.BUYER;
      } else if (roleRandom < 0.98) {
        user.role = UserRole.SELLER;
      } else {
        user.role = UserRole.ADMIN;
      }

      user.createdAt = registrationDate;
      user.updatedAt = registrationDate;
      user.deletedAt = null;

      users.push(user);
    }

    try {
      // 分批儲存以提升效能
      const batchSize = 100;
      for (let i = 0; i < users.length; i += batchSize) {
        const batch = users.slice(i, i + batchSize);
        await this.entityManager.save(User, batch);
      }

      this.logger.log(`成功產生 ${users.length} 筆測試用戶。`);
      return { success: users.length, errors: [] };
    } catch (error) {
      this.logger.error(
        '儲存測試用戶失敗',
        error instanceof Error ? error.stack : String(error),
      );
      return {
        success: 0,
        errors: [error instanceof Error ? error.message : String(error)],
      };
    }
  }
}
