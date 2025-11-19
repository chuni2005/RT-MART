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
  @PrimaryGeneratedColumn({ name: 'inventory_id', type: 'bigint' })
  inventoryId: string;

  @Column({ name: 'product_id', type: 'bigint', unique: true })
  productId: string;

  @Column({ type: 'int', default: 0, comment: '可用庫存' })
  quantity: number;

  @Column({ type: 'int', default: 0, comment: '已預留但未提交' })
  reserved: number;

  @UpdateDateColumn({
    name: 'last_updated',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  lastUpdated: Date;

  // Relations
  @OneToOne(() => Product, (product) => product.inventory, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;
}
