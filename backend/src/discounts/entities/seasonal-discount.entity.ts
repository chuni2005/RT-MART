import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Discount } from './discount.entity';

@Entity('SeasonalDiscount')
export class SeasonalDiscount {
  @PrimaryGeneratedColumn({ name: 'seasonal_discount_id', type: 'bigint' })
  seasonalDiscountId: string;

  @Column({ name: 'discount_id', type: 'bigint', unique: true })
  discountId: string;

  @Column({ name: 'discount_rate', type: 'decimal', precision: 5, scale: 4 })
  discountRate: number;

  @Column({
    name: 'max_discount_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  maxDiscountAmount: number | null;

  // Relations
  @OneToOne(() => Discount, (discount) => discount.seasonalDiscount, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'discount_id' })
  discount: Discount;
}
