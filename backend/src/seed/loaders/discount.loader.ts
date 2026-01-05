import { BaseLoader } from './base.loader';
import {
  Discount,
  DiscountType,
  CreatedByType,
} from '../../discounts/entities/discount.entity';
import { DataMapper } from '../utils/data-mapper';

export class DiscountLoader extends BaseLoader<Discount> {
  protected entityName = 'Discount';
  protected jsonFileName = 'ecommerce_discount_data.json';
  protected entityClass = Discount;

  protected validateAndTransform(
    data: Record<string, unknown>,
  ): Promise<Discount | null> {
    try {
      if (
        !data.script_discount_id ||
        !data.discount_code ||
        !data.discount_type ||
        !data.name
      ) {
        return Promise.resolve(null);
      }

      if (
        typeof data.discount_code !== 'string' ||
        typeof data.name !== 'string'
      ) {
        return Promise.resolve(null);
      }

      const discount = new Discount();
      discount.discountCode = data.discount_code;
      discount.discountType = data.discount_type as DiscountType;
      discount.name = data.name;
      discount.description =
        typeof data.description === 'string' ? data.description : null;
      discount.minPurchaseAmount = Math.round(
        typeof data.min_purchase_amount === 'number'
          ? data.min_purchase_amount
          : Number(data.min_purchase_amount) || 0,
      );
      const startDatetime = DataMapper.parseDate(
        typeof data.start_datetime === 'string' ? data.start_datetime : null,
      );
      const endDatetime = DataMapper.parseDate(
        typeof data.end_datetime === 'string' ? data.end_datetime : null,
      );
      if (!startDatetime || !endDatetime) {
        return Promise.resolve(null);
      }
      discount.startDatetime = startDatetime;
      discount.endDatetime = endDatetime;
      discount.isActive =
        typeof data.is_active === 'boolean' ? data.is_active : true;
      discount.usageLimit =
        typeof data.usage_limit === 'number' ? data.usage_limit : null;
      discount.usageCount =
        typeof data.usage_count === 'number'
          ? data.usage_count
          : Number(data.usage_count) || 0;
      discount.createdByType = data.created_by_type as CreatedByType;
      if (data.created_by_id) {
        const userId = this.idMapping.getMapping(
          'User',
          typeof data.created_by_id === 'number'
            ? data.created_by_id
            : Number(data.created_by_id),
        );
        discount.createdById =
          userId ||
          (typeof data.created_by_id === 'string'
            ? data.created_by_id
            : typeof data.created_by_id === 'number'
              ? String(data.created_by_id)
              : null);
      } else {
        discount.createdById = null;
      }

      return Promise.resolve(discount);
    } catch {
      return Promise.resolve(null);
    }
  }

  protected async checkExists(entity: Discount): Promise<boolean> {
    const existing = await this.entityManager.findOne(Discount, {
      where: { discountCode: entity.discountCode },
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
      const discounts = await this.entityManager.find(Discount, {
        order: { discountId: 'DESC' },
        take: result.success,
      });

      for (const data of jsonData) {
        if (data.script_discount_id) {
          const discount = discounts.find(
            (d) =>
              typeof data.discount_code === 'string' &&
              d.discountCode === data.discount_code,
          );
          if (discount) {
            this.idMapping.setMapping(
              'Discount',
              typeof data.script_discount_id === 'number'
                ? data.script_discount_id
                : Number(data.script_discount_id),
              discount.discountId,
            );
          }
        }
      }
    }

    return result;
  }
}
