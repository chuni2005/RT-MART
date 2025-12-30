import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Store } from '../../stores/entities/store.entity';

@Entity('Seller')
export class Seller {
  @PrimaryGeneratedColumn({ name: 'seller_id', type: 'bigint' })
  sellerId: string;

  @Column({ name: 'user_id', type: 'bigint', unique: true })
  userId: string;

  @Column({
    name: 'bank_account_reference',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  bankAccountReference: string | null;

  @Column({ type: 'boolean', default: false })
  verified: boolean;

  @Column({ name: 'verified_at', type: 'timestamp', nullable: true })
  verifiedAt: Date | null;

  @Column({ name: 'verified_by', type: 'bigint', nullable: true })
  verifiedBy: string | null;

  @Column({ name: 'rejected_at', type: 'timestamp', nullable: true })
  rejectedAt: Date | null;

  @Column({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @Column({
    name: 'updated_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  // Relations
  @OneToOne(() => User, (user) => user.seller, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'verified_by' })
  verifier?: User;

  @OneToOne(() => Store, (store) => store.seller)
  stores?: Store[];
}
