import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Seller } from '../../sellers/entities/seller.entity';
import { Product } from '../../products/entities/product.entity';
import { Order } from '../../orders/entities/order.entity';

@Entity('Store')
@Index(['sellerId'])
@Index(['storeName'])
@Index(['deletedAt', 'averageRating']) // for active stores ranking
export class Store {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'store_id' })
  storeId: string;

  @Column({ type: 'bigint', name: 'seller_id' })
  sellerId: string;

  @Column({ type: 'varchar', length: 200, name: 'store_name' })
  storeName: string;

  @Column({ type: 'text', nullable: true, name: 'store_description' })
  storeDescription: string | null;

  @Column({ type: 'text', nullable: true, name: 'store_address' })
  storeAddress: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'store_email' })
  storeEmail: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'store_phone' })
  storePhone: string | null;

  @Column({
    type: 'decimal',
    precision: 2,
    scale: 1,
    default: 0,
    name: 'average_rating',
  })
  averageRating: number;

  @Column({ type: 'int', default: 0, name: 'total_ratings' })
  totalRatings: number;

  @DeleteDateColumn({ type: 'timestamp', name: 'deleted_at', nullable: true })
  deletedAt: Date | null;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Seller, (seller) => seller.stores, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'seller_id' })
  seller: Seller;

  @OneToMany(() => Product, (product) => product.store)
  products?: Product[];

  @OneToMany(() => Order, (order) => order.store)
  orders?: Order[];
}
