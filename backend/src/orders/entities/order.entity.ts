import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Store } from '../../stores/entities/store.entity';
import { OrderItem } from './order-item.entity';
import { OrderDiscount } from './order-discount.entity';

export enum OrderStatus {
  PENDING_PAYMENT = 'pending_payment',
  PAYMENT_FAILED = 'payment_failed',
  PAID = 'paid',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('Order')
@Index('idx_order_number', ['orderNumber'])
@Index('idx_user_id', ['userId'])
@Index('idx_store_id', ['storeId'])
@Index('idx_order_status', ['orderStatus'])
@Index('idx_idempotency_key', ['idempotencyKey'])
@Index('idx_created_at', ['createdAt'])
@Index('idx_user_created', ['userId', 'createdAt'])
@Index('idx_store_created', ['storeId', 'createdAt'])
export class Order {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'order_id' })
  orderId: string;

  @Column({ type: 'varchar', length: 50, unique: true, name: 'order_number' })
  orderNumber: string;

  @Column({ type: 'bigint', name: 'user_id' })
  userId: string;

  @Column({ type: 'bigint', name: 'store_id' })
  storeId: string;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING_PAYMENT,
    name: 'order_status',
  })
  orderStatus: OrderStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 60,
    name: 'shipping_fee',
  })
  shippingFee: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    name: 'total_discount',
  })
  totalDiscount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'total_amount' })
  totalAmount: number;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    name: 'payment_method',
  })
  paymentMethod: string | null;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'payment_reference',
  })
  paymentReference: string | null;

  @Column({
    type: 'varchar',
    length: 128,
    unique: true,
    nullable: true,
    name: 'idempotency_key',
  })
  idempotencyKey: string | null;

  @Column({ type: 'json', name: 'shipping_address_snapshot' })
  shippingAddressSnapshot: object;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'paid_at' })
  paidAt: Date | null;

  @Column({ type: 'timestamp', nullable: true, name: 'shipped_at' })
  shippedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true, name: 'delivered_at' })
  deliveredAt: Date | null;

  @Column({ type: 'timestamp', nullable: true, name: 'completed_at' })
  completedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true, name: 'cancelled_at' })
  cancelledAt: Date | null;

  // Relations
  @ManyToOne(() => User, (user) => user.orders, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Store, (store) => store.orders, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items?: OrderItem[];

  @OneToMany(() => OrderDiscount, (orderDiscount) => orderDiscount.order, {
    cascade: true,
  })
  orderDiscounts?: OrderDiscount[];
}
