import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Product } from '../../products/entities/product.entity';

@Entity('ProductType')
@Index(['typeCode'])
@Index(['parentTypeId'])
export class ProductType {
  @PrimaryGeneratedColumn({ name: 'product_type_id', type: 'bigint' })
  productTypeId: string;

  @Column({ name: 'type_code', type: 'varchar', length: 50, unique: true })
  typeCode: string;

  @Column({ name: 'type_name', type: 'varchar', length: 100 })
  typeName: string;

  @Column({ name: 'parent_type_id', type: 'bigint', nullable: true })
  parentTypeId: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  // Relations
  @ManyToOne(() => ProductType, (type) => type.children, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'parent_type_id' })
  parent?: ProductType;

  @OneToMany(() => ProductType, (type) => type.parent)
  children?: ProductType[];

  @OneToMany(() => Product, (product) => product.productType)
  products?: Product[];
}
