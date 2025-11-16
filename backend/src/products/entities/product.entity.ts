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
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'product_id' })
  productId: string;

  @Column({ type: 'bigint', name: 'store_id' })
  storeId: string;

  @Column({ type: 'bigint', name: 'product_type_id' })
  productTypeId: string;

  @Column({ type: 'varchar', length: 200, name: 'product_name' })
  productName: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'bigint', default: 0, name: 'view_count' })
  viewCount: number;

  @Column({
    type: 'decimal',
    precision: 2,
    scale: 1,
    default: 0,
    name: 'average_rating',
  })
  averageRating: number;

  @Column({ type: 'int', default: 0, name: 'total_reviews' })
  totalReviews: number;

  @DeleteDateColumn({ type: 'timestamp', name: 'deleted_at', nullable: true })
  deletedAt: Date | null;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
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

  @OneToMany(() => ProductImage, (image) => image.product, { cascade: true })
  images?: ProductImage[];

  @OneToOne(() => Inventory, (inventory) => inventory.product, {
    cascade: true,
  })
  inventory?: Inventory;

  @OneToMany(() => CartItem, (item) => item.product)
  cartItems?: CartItem[];

  @OneToMany(() => OrderItem, (item) => item.product)
  orderItems?: OrderItem[];
}
