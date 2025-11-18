import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('CartHistory')
@Index(['userId'])
@Index(['createdAt'])
export class CartHistory {
  @PrimaryGeneratedColumn({ name: 'cart_history_id', type: 'bigint' })
  cartHistoryId: string;

  @Column({ name: 'user_id', type: 'bigint' })
  userId: string;

  @Column({ name: 'cart_snapshot', type: 'json' })
  cartSnapshot: object;

  @Column({ name: 'item_count', type: 'int' })
  itemCount: number;

  @Column({ name: 'order_ids', type: 'json', nullable: true })
  orderIds: string[] | null;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.cartHistories, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
