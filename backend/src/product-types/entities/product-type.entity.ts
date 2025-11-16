import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Tree,
  TreeChildren,
  TreeParent,
  Index,
} from 'typeorm';
import { Product } from '../../products/entities/product.entity';

@Entity('ProductType')
@Tree('closure-table')
@Index(['typeCode'])
@Index(['parentTypeId'])
export class ProductType {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'product_type_id' })
  productTypeId: string;

  @Column({ type: 'varchar', length: 50, unique: true, name: 'type_code' })
  typeCode: string;

  @Column({ type: 'varchar', length: 100, name: 'type_name' })
  typeName: string;

  @Column({ type: 'bigint', nullable: true, name: 'parent_type_id' })
  parentTypeId: string | null;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  // Relations
  @TreeParent()
  @ManyToOne(() => ProductType, (type) => type.children, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'parent_type_id' })
  parent?: ProductType;

  @TreeChildren()
  @OneToMany(() => ProductType, (type) => type.parent)
  children?: ProductType[];

  @OneToMany(() => Product, (product) => product.productType)
  products?: Product[];
}
