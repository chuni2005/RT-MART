import { BaseLoader } from './base.loader';
import { Seller } from '../../sellers/entities/seller.entity';
import { DataMapper } from '../utils/data-mapper';

export class SellerLoader extends BaseLoader<Seller> {
  protected entityName = 'Seller';
  protected jsonFileName = 'ecommerce_seller_data.json';
  protected entityClass = Seller;

  protected validateAndTransform(
    data: Record<string, unknown>,
  ): Promise<Seller | null> {
    try {
      if (!data.script_seller_id || !data.user_id) {
        return Promise.resolve(null);
      }

      // 從 IdMapping 取得實際的 user_id
      const userId = this.idMapping.getMapping(
        'User',
        typeof data.user_id === 'number' ? data.user_id : Number(data.user_id),
      );
      if (!userId) {
        return Promise.resolve(null);
      }

      const seller = new Seller();
      seller.userId = userId;
      seller.bankAccountReference =
        typeof data.bank_account_reference === 'string'
          ? data.bank_account_reference
          : null;
      seller.verified =
        typeof data.verified === 'boolean' ? data.verified : false;
      seller.verifiedAt = DataMapper.parseDate(
        typeof data.verified_at === 'string' ? data.verified_at : null,
      );
      seller.verifiedBy = data.verified_by
        ? this.idMapping.getMapping(
            'User',
            typeof data.verified_by === 'number'
              ? data.verified_by
              : Number(data.verified_by),
          )
        : null;
      seller.rejectedAt = DataMapper.parseDate(
        typeof data.rejected_at === 'string' ? data.rejected_at : null,
      );
      seller.createdAt = DataMapper.parseDate(
        typeof data.created_at === 'string' ? data.created_at : null,
      ) || new Date();
      seller.updatedAt = DataMapper.parseDate(
        typeof data.updated_at === 'string' ? data.updated_at : null,
      ) || new Date();

      return Promise.resolve(seller);
    } catch {
      return Promise.resolve(null);
    }
  }

  protected async checkExists(entity: Seller): Promise<boolean> {
    const existing = await this.entityManager.findOne(Seller, {
      where: { userId: entity.userId },
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
    const result = await super.load(force);

    // 更新 ID 映射
    if (result.success > 0) {
      const jsonData = this.loadJson();
      const sellers = await this.entityManager.find(Seller, {
        order: { sellerId: 'DESC' },
        take: result.success,
      });

      for (const data of jsonData) {
        if (data.script_seller_id) {
          const userId = this.idMapping.getMapping(
            'User',
            typeof data.user_id === 'number'
              ? data.user_id
              : Number(data.user_id),
          );
          if (userId) {
            const seller = sellers.find((s) => s.userId === userId);
            if (seller) {
              this.idMapping.setMapping(
                'Seller',
                typeof data.script_seller_id === 'number'
                  ? data.script_seller_id
                  : Number(data.script_seller_id),
                seller.sellerId,
              );
            }
          }
        }
      }
    }

    return result;
  }
}
