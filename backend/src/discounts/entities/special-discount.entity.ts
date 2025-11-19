import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { Discount } from './discount.entity';
import { Store } from '../../stores/entities/store.entity';
import { ProductType } from '../../product-types/entities/product-type.entity';

@Entity('SpecialDiscount')
@Index('idx_store_id', ['storeId'])
@Index('idx_product_type_id', ['productTypeId'])
@Index(
  'idx_store_product_discount',
  ['storeId', 'productTypeId', 'discountId'],
  {
    unique: true,
  },
)
export class SpecialDiscount {
  @PrimaryGeneratedColumn({ name: 'special_discount_id', type: 'bigint' })
  specialDiscountId: string;

  @Column({ name: 'discount_id', type: 'bigint', unique: true })
  discountId: string;

  @Column({ name: 'store_id', type: 'bigint' })
  storeId: string;

  @Column({ name: 'product_type_id', type: 'bigint', nullable: true })
  productTypeId: string | null;

  @Column({
    name: 'discount_rate',
    type: 'decimal',
    precision: 5,
    scale: 4,
    nullable: true,
  })
  discountRate: number | null;

  @Column({
    name: 'max_discount_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  maxDiscountAmount: number | null;

  // Relations
  @OneToOne(() => Discount, (discount) => discount.specialDiscount, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'discount_id' })
  discount: Discount;

  @ManyToOne(() => Store, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @ManyToOne(() => ProductType, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'product_type_id' })
  productType?: ProductType;
}
