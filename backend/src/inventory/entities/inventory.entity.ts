import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Product } from '../../products/entities/product.entity';

@Entity('Inventory')
@Index(['productId'])
export class Inventory {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'inventory_id' })
  inventoryId: string;

  @Column({ type: 'bigint', unique: true, name: 'product_id' })
  productId: string;

  @Column({ type: 'int', default: 0, comment: '可用庫存' })
  quantity: number;

  @Column({ type: 'int', default: 0, comment: '已預留但未提交' })
  reserved: number;

  @UpdateDateColumn({ type: 'timestamp', name: 'last_updated' })
  lastUpdated: Date;

  // Relations
  @OneToOne(() => Product, (product) => product.inventory, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;
}
