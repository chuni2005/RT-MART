import { IsNull } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { BaseLoader } from './base.loader';
import { User, UserRole } from '../../users/entities/user.entity';

export class UserLoader extends BaseLoader<User> {
  protected entityName = 'User';
  protected jsonFileName = 'ecommerce_user_data.json';
  protected entityClass = User;

  protected async validateAndTransform(
    data: Record<string, unknown>,
  ): Promise<User | null> {
    try {
      // 取得 script_id 用於映射
      const scriptId = data.script_id;
      if (!scriptId) {
        return null;
      }

      // 驗證必要欄位
      if (
        typeof data.login_id !== 'string' ||
        typeof data.password !== 'string' ||
        typeof data.name !== 'string' ||
        typeof data.email !== 'string'
      ) {
        return null;
      }

      // Hash 密碼
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(data.password, saltRounds);

      // 建立 User 實體
      const user = new User();
      user.loginId = data.login_id;
      user.passwordHash = passwordHash;
      user.name = data.name;
      user.email = data.email;
      user.avatarUrl =
        typeof data.avatar_url === 'string'
          ? data.avatar_url
          : `https://i.pravatar.cc/150?img=${scriptId}`;
      user.phoneNumber =
        typeof data.phone_number === 'string' ? data.phone_number : null;
      user.role =
        typeof data.role === 'string' &&
        (data.role === 'buyer' ||
          data.role === 'seller' ||
          data.role === 'admin')
          ? (data.role as UserRole)
          : UserRole.BUYER;
      user.deletedAt = null;

      // 記錄 ID 映射
      // 注意：這裡先記錄 scriptId，實際的 userId 會在插入後取得
      // 但我們需要在插入後更新映射
      return user;
    } catch {
      return null;
    }
  }

  protected async checkExists(entity: User): Promise<boolean> {
    const existing = await this.entityManager.findOne(User, {
      where: [
        { loginId: entity.loginId, deletedAt: IsNull() },
        { email: entity.email, deletedAt: IsNull() },
      ],
    });
    return existing !== null;
  }

  async load(force: boolean = false): Promise<{
    success: number;
    skipped: number;
    errors: Array<{
      data: Record<string, unknown>;
      error: string;
      stack?: string;
    }>;
  }> {
    const startTime = Date.now();
    this.logger.log(`Starting to load ${this.entityName}...`);

    const jsonData = this.loadJson();
    const entities: User[] = [];
    const scriptIdMap = new Map<User, number>(); // 記錄 entity 對應的 script_id
    const errors: Array<{
      data: Record<string, unknown>;
      error: string;
      stack?: string;
    }> = [];
    let skipped = 0;

    // 轉換和驗證資料
    for (const data of jsonData) {
      try {
        const entity = await this.validateAndTransform(data);
        if (!entity) {
          errors.push({
            data,
            error: 'Validation failed: entity is null',
          });
          continue;
        }

        // 檢查是否已存在（除非是 force 模式）
        if (!force) {
          const exists = await this.checkExists(entity);
          if (exists) {
            skipped++;
            // 如果已存在，也要建立映射
            const existing = await this.entityManager.findOne(User, {
              where: [
                { loginId: entity.loginId, deletedAt: IsNull() },
                { email: entity.email, deletedAt: IsNull() },
              ],
            });
            if (
              existing &&
              data.script_id &&
              typeof data.script_id === 'number'
            ) {
              this.idMapping.setMapping(
                'User',
                data.script_id,
                existing.userId,
              );
            }
            this.logger.warn(
              `Skipping ${this.entityName} (already exists): ${JSON.stringify(data)}`,
            );
            continue;
          }
        }

        entities.push(entity);
        if (data.script_id && typeof data.script_id === 'number') {
          scriptIdMap.set(entity, data.script_id);
        }
      } catch (error) {
        errors.push({
          data,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        this.logger.error(
          `Error transforming ${this.entityName} data: ${JSON.stringify(data)}`,
          error instanceof Error ? error.stack : String(error),
        );
      }
    }

    // 批次插入
    let success = 0;
    if (entities.length > 0) {
      try {
        const saved = await this.entityManager.save(User, entities);
        success = saved.length;

        // 建立 ID 映射
        for (const savedUser of saved) {
          const scriptId = scriptIdMap.get(
            entities.find(
              (e) =>
                e.loginId === savedUser.loginId || e.email === savedUser.email,
            )!,
          );
          if (scriptId) {
            this.idMapping.setMapping('User', scriptId, savedUser.userId);
          }
        }

        this.logger.log(
          `Successfully inserted ${success} ${this.entityName} records`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to insert ${this.entityName} records`,
          error instanceof Error ? error.stack : String(error),
        );
        throw error;
      }
    }

    const duration = Date.now() - startTime;
    this.logger.log(
      `Completed loading ${this.entityName}: ${success} inserted, ${skipped} skipped, ${errors.length} errors (${duration}ms)`,
    );

    return { success, skipped, errors };
  }
}
