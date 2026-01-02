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
  @PrimaryGeneratedColumn({ name: 'order_id', type: 'bigint' })
  orderId: string;

  @Column({ name: 'order_number', type: 'varchar', length: 50, unique: true })
  orderNumber: string;

  @Column({ name: 'user_id', type: 'bigint' })
  userId: string;

  @Column({ name: 'store_id', type: 'bigint' })
  storeId: string;

  @Column({
    name: 'order_status',
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING_PAYMENT,
  })
  orderStatus: OrderStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @Column({
    name: 'shipping_fee',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 60,
  })
  shippingFee: number;

  @Column({
    name: 'total_discount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  totalDiscount: number;

  @Column({ name: 'total_amount', type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({
    name: 'payment_method',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  paymentMethod: string | null;

  @Column({
    name: 'payment_reference',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  paymentReference: string | null;

  @Column({
    name: 'idempotency_key',
    type: 'varchar',
    length: 128,
    unique: true,
    nullable: true,
  })
  idempotencyKey: string | null;

  @Column({ name: 'shipping_address_snapshot', type: 'json' })
  shippingAddressSnapshot: object;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @Column({ name: 'paid_at', type: 'timestamp', nullable: true })
  paidAt: Date | null;

  @Column({ name: 'shipped_at', type: 'timestamp', nullable: true })
  shippedAt: Date | null;

  @Column({ name: 'delivered_at', type: 'timestamp', nullable: true })
  deliveredAt: Date | null;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date | null;

  @Column({ name: 'cancelled_at', type: 'timestamp', nullable: true })
  cancelledAt: Date | null;

  // Relations
  @ManyToOne(() => User, (user) => user.orders, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Store, (store) => store.orders, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];

  @OneToMany(() => OrderDiscount, (orderDiscount) => orderDiscount.order, {
    cascade: true,
  })
  orderDiscounts: OrderDiscount[];
}
