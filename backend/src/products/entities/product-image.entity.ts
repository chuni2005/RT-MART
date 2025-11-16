import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Product } from './product.entity';

@Entity('ProductImage')
@Index(['productId'])
@Index(['productId', 'displayOrder'])
export class ProductImage {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'image_id' })
  imageId: string;

  @Column({ type: 'bigint', name: 'product_id' })
  productId: string;

  @Column({ type: 'varchar', length: 500, name: 'image_url' })
  imageUrl: string;

  @Column({ type: 'int', default: 1, name: 'display_order' })
  displayOrder: number;

  // Relations
  @ManyToOne(() => Product, (product) => product.images, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;
}
