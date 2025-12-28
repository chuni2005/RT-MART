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
  OneToOne,
  Index,
} from 'typeorm';
import { Store } from '../../stores/entities/store.entity';
import { ProductType } from '../../product-types/entities/product-type.entity';
import { ProductImage } from './product-image.entity';
import { Inventory } from '../../inventory/entities/inventory.entity';
import { CartItem } from '../../carts/entities/cart-item.entity';
import { OrderItem } from '../../orders/entities/order-item.entity';

@Entity('Product')
@Index(['storeId'])
@Index(['productTypeId'])
@Index(['productName'])
@Index(['storeId', 'productTypeId'])
@Index(['price', 'deletedAt']) // for price range queries on active products
export class Product {
  @PrimaryGeneratedColumn({ name: 'product_id', type: 'bigint' })
  productId: string;

  @Column({ name: 'store_id', type: 'bigint' })
  storeId: string;

  @Column({ name: 'product_type_id', type: 'bigint' })
  productTypeId: string;

  @Column({ name: 'product_name', type: 'varchar', length: 200 })
  productName: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ name: 'sold_count', type: 'bigint', default: 0 })
  soldCount: number;

  @Column({
    name: 'average_rating',
    type: 'decimal',
    precision: 2,
    scale: 1,
    default: 0,
  })
  averageRating: number;

  @Column({ name: 'total_reviews', type: 'int', default: 0 })
  totalReviews: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @DeleteDateColumn({ type: 'timestamp', name: 'deleted_at', nullable: true })
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
  @ManyToOne(() => Store, (store) => store.products, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @ManyToOne(() => ProductType, (type) => type.products, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'product_type_id' })
  productType: ProductType;

  @OneToMany(() => ProductImage, (image) => image.product, { cascade: false })
  images?: ProductImage[];

  @OneToOne(() => Inventory, (inventory) => inventory.product, {
    cascade: false,
  })
  inventory?: Inventory;

  @OneToMany(() => CartItem, (item) => item.product)
  cartItems?: CartItem[];

  @OneToMany(() => OrderItem, (item) => item.product)
  orderItems?: OrderItem[];
}
