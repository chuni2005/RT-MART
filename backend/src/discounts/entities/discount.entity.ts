import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  OneToOne,
  Index,
} from 'typeorm';
import { SeasonalDiscount } from './seasonal-discount.entity';
import { ShippingDiscount } from './shipping-discount.entity';
import { SpecialDiscount } from './special-discount.entity';

export enum DiscountType {
  SEASONAL = 'seasonal',
  SHIPPING = 'shipping',
  SPECIAL = 'special',
}

export enum CreatedByType {
  SYSTEM = 'system',
  SELLER = 'seller',
}

@Entity('Discount')
@Index('idx_discount_code', ['discountCode'])
@Index('idx_discount_type', ['discountType'])
@Index('idx_discount_active_period', [
  'discountType',
  'isActive',
  'startDatetime',
  'endDatetime',
])
@Index('idx_created_by', ['createdByType', 'createdById'])
export class Discount {
  @PrimaryGeneratedColumn({ name: 'discount_id', type: 'bigint' })
  discountId: string;

  @Column({ name: 'discount_code', type: 'varchar', length: 50, unique: true })
  discountCode: string;

  @Column({ name: 'discount_type', type: 'enum', enum: DiscountType })
  discountType: DiscountType;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({
    name: 'min_purchase_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  minPurchaseAmount: number;

  @Column({ name: 'start_datetime', type: 'timestamp' })
  startDatetime: Date;

  @Column({ name: 'end_datetime', type: 'timestamp' })
  endDatetime: Date;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'usage_limit', type: 'int', nullable: true })
  usageLimit: number | null;

  @Column({ name: 'usage_count', type: 'int', default: 0 })
  usageCount: number;

  @Column({ name: 'created_by_type', type: 'enum', enum: CreatedByType })
  createdByType: CreatedByType;

  @Column({ name: 'created_by_id', type: 'bigint', nullable: true })
  createdById: string | null;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  // Relations
  @OneToOne(() => SeasonalDiscount, (seasonal) => seasonal.discount)
  seasonalDiscount?: SeasonalDiscount;

  @OneToOne(() => ShippingDiscount, (shipping) => shipping.discount)
  shippingDiscount?: ShippingDiscount;

  @OneToOne(() => SpecialDiscount, (special) => special.discount)
  specialDiscount?: SpecialDiscount;
}
