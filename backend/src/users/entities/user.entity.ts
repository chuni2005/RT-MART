import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToOne,
  OneToMany,
  Index,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Seller } from '../../sellers/entities/seller.entity';
import { ShippingAddress } from '../../shipping-addresses/entities/shipping-address.entity';
import { UserToken } from '../../auth/entities/user-token.entity';
// import { Cart } from '../../carts-item/entities/cart.entity';
import { CartItem } from '../../carts-item/entities/cart-item.entity';
import { Order } from '../../orders/entities/order.entity';
import { CartHistory } from '../../cart-history/entities/cart-history.entity';
import { AuditLog } from '../../audit-logs/entities/audit-log.entity';
import { Review } from '../../review/entities/review.entity';

export enum UserRole {
  BUYER = 'buyer',
  SELLER = 'seller',
  ADMIN = 'admin',
}

@Entity('User')
@Index(['loginId']) // Already unique, but explicit index for faster lookups
@Index(['email']) // Already unique, but explicit index for faster lookups
@Index(['role']) // Role: buyer, seller, admin
@Index(['deletedAt']) // For soft delete queries
// @Index(['role', 'deletedAt']) // Composite index for active users by role
@Index(['createdAt']) // For sorting by registration date
export class User {
  @PrimaryGeneratedColumn({ name: 'user_id', type: 'bigint' })
  userId: string;

  @Column({ name: 'login_id', type: 'varchar', length: 50, unique: true })
  loginId: string;

  @Exclude()
  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  email: string;

  @Column({ name: 'avatar_url', type: 'varchar', length: 255, nullable: true })
  avatarUrl: string | null;

  @Column({ name: 'phone_number', type: 'varchar', length: 20, nullable: true })
  phoneNumber: string | null;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.BUYER,
  })
  role: UserRole;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date | null;

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

  // Relations
  @OneToOne(() => Seller, (seller) => seller.user, { cascade: true })
  seller?: Seller;

  @OneToMany(() => ShippingAddress, (address) => address.user)
  shippingAddresses?: ShippingAddress[];

  @OneToMany(() => UserToken, (token) => token.user)
  tokens?: UserToken[];

  @OneToMany(() => CartItem, (cartItem) => cartItem.user)
  cartItems?: CartItem[];

  @OneToMany(() => Order, (order) => order.user)
  orders?: Order[];

  @OneToMany(() => CartHistory, (history) => history.user)
  cartHistories?: CartHistory[];

  @OneToMany(() => AuditLog, (log) => log.user)
  auditLogs?: AuditLog[];

  @OneToMany(() => Review, (review) => review.user)
  reviews?: Review[];
}
