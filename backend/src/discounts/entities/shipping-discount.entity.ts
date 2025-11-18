import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Discount } from './discount.entity';

@Entity('ShippingDiscount')
export class ShippingDiscount {
  @PrimaryGeneratedColumn({ name: 'shipping_discount_id', type: 'bigint' })
  shippingDiscountId: string;

  @Column({ name: 'discount_id', type: 'bigint', unique: true })
  discountId: string;

  @Column({ name: 'discount_amount', type: 'decimal', precision: 10, scale: 2 })
  discountAmount: number;

  // Relations
  @OneToOne(() => Discount, (discount) => discount.shippingDiscount, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'discount_id' })
  discount: Discount;
}
