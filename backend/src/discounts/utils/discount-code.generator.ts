import { DiscountType } from '../entities/discount.entity';

/**
 * 根據折扣類型生成折扣碼
 * 格式: [TYPE_PREFIX]_[RANDOM]
 * 範例: SEAS_X7K2, SHIP_Q9M4, SPEC_A93F
 */
export function generateDiscountCode(discountType: DiscountType): string {
  const prefixes: Record<DiscountType, string> = {
    [DiscountType.SEASONAL]: 'SEAS',
    [DiscountType.SHIPPING]: 'SHIP',
    [DiscountType.SPECIAL]: 'SPEC',
  };

  const prefix = prefixes[discountType];
  const random = generateRandomString(4); // A-Z0-9, 4 字符

  return `${prefix}_${random}`;
}

/**
 * 生成指定長度的隨機字串（A-Z0-9）
 * @param length 字串長度
 * @returns 隨機字串
 */
function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
