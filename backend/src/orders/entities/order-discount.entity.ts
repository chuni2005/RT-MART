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
  @PrimaryGeneratedColumn({ name: 'order_discount_id', type: 'bigint' })
  orderDiscountId: string;

  @Column({ name: 'order_id', type: 'bigint' })
  orderId: string;

  @Column({ name: 'discount_id', type: 'bigint' })
  discountId: string;

  @Column({ name: 'discount_type', type: 'enum', enum: DiscountType })
  discountType: DiscountType;

  @Column({ name: 'discount_amount', type: 'decimal', precision: 10, scale: 2 })
  discountAmount: number;

  @CreateDateColumn({
    name: 'applied_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
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
