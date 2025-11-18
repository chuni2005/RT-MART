import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Order } from './order.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('OrderItem')
@Index('idx_order_id', ['orderId'])
@Index('idx_product_id', ['productId'])
export class OrderItem {
  @PrimaryGeneratedColumn({ name: 'order_item_id', type: 'bigint' })
  orderItemId: string;

  @Column({ name: 'order_id', type: 'bigint' })
  orderId: string;

  @Column({ name: 'product_id', type: 'bigint', nullable: true })
  productId: string | null;

  @Column({ name: 'product_snapshot', type: 'json' })
  productSnapshot: object;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ name: 'original_price', type: 'decimal', precision: 10, scale: 2 })
  originalPrice: number;

  @Column({
    name: 'item_discount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  itemDiscount: number;

  @Column({ name: 'unit_price', type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  // Relations
  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @ManyToOne(() => Product, (product) => product.orderItems, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'product_id' })
  product?: Product;
}
