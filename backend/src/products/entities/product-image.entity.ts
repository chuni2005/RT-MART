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
  @PrimaryGeneratedColumn({ name: 'image_id', type: 'bigint' })
  imageId: string;

  @Column({ name: 'product_id', type: 'bigint' })
  productId: string;

  @Column({ name: 'image_url', type: 'varchar', length: 500, nullable: true })
  imageUrl: string;

  @Column({ name: 'public_id', type: 'varchar', length: 50, nullable: true })
  publicId: string;

  @Column({ name: 'display_order', type: 'int', default: 1 })
  displayOrder: number;

  // Relations
  @ManyToOne(() => Product, (product) => product.images, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;
}
