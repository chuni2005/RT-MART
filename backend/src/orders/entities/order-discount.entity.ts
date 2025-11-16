import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Order } from './order.entity';
import { Discount } from '../../discounts/entities/discount.entity';
import { DiscountType } from '../../discounts/entities/discount.entity';

@Entity('OrderDiscount')
@Index('idx_order_id', ['orderId'])
@Index('idx_discount_id', ['discountId'])
@Index('idx_order_discount_type', ['orderId', 'discountType'], { unique: true })
export class OrderDiscount {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'order_discount_id' })
  orderDiscountId: string;

  @Column({ type: 'bigint', name: 'order_id' })
  orderId: string;

  @Column({ type: 'bigint', name: 'discount_id' })
  discountId: string;

  @Column({ type: 'enum', enum: DiscountType, name: 'discount_type' })
  discountType: DiscountType;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'discount_amount' })
  discountAmount: number;

  @CreateDateColumn({ type: 'timestamp', name: 'applied_at' })
  appliedAt: Date;

  // Relations
  @ManyToOne(() => Order, (order) => order.orderDiscounts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @ManyToOne(() => Discount, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'discount_id' })
  discount: Discount;
}
