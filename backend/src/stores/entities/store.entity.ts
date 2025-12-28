import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  JoinColumn,
  OneToMany,
  Index,
  OneToOne,
} from 'typeorm';
import { Seller } from '../../sellers/entities/seller.entity';
import { Product } from '../../products/entities/product.entity';
import { Order } from '../../orders/entities/order.entity';

@Entity('Store')
@Index(['sellerId'])
@Index(['storeName'])
@Index(['deletedAt', 'averageRating']) // for active stores ranking
export class Store {
  @PrimaryGeneratedColumn({ name: 'store_id', type: 'bigint' })
  storeId: string;

  @Column({ name: 'seller_id', type: 'bigint' })
  sellerId: string;

  @Column({ name: 'store_name', type: 'varchar', length: 200 })
  storeName: string;

  @Column({ name: 'store_description', type: 'text', nullable: true })
  storeDescription: string | null;

  @Column({ name: 'store_address', type: 'text', nullable: true })
  storeAddress: string | null;

  @Column({ name: 'store_email', type: 'varchar', length: 100, nullable: true })
  storeEmail: string | null;

  @Column({ name: 'store_phone', type: 'varchar', length: 20, nullable: true })
  storePhone: string | null;

  @Column({
    name: 'store_avatar',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  avatar: string | null;

  @Column({
    name: 'average_rating',
    type: 'decimal',
    precision: 2,
    scale: 1,
    default: 0,
  })
  averageRating: number;

  @Column({ name: 'total_ratings', type: 'int', default: 0 })
  totalRatings: number;

  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'timestamp',
    nullable: true,
  })
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
  @OneToOne(() => Seller, (seller) => seller.stores, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'seller_id' })
  seller: Seller;

  @OneToMany(() => Product, (product) => product.store)
  products?: Product[];

  @OneToMany(() => Order, (order) => order.store)
  orders?: Order[];

  @Column({ name: 'product_count', type: 'int', default: 0 })
  productCount: number;
}
