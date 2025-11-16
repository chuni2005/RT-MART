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
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'order_item_id' })
  orderItemId: string;

  @Column({ type: 'bigint', name: 'order_id' })
  orderId: string;

  @Column({ type: 'bigint', nullable: true, name: 'product_id' })
  productId: string | null;

  @Column({ type: 'json', name: 'product_snapshot' })
  productSnapshot: object;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'original_price' })
  originalPrice: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    name: 'item_discount',
  })
  itemDiscount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'unit_price' })
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
