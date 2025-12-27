import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
  ManyToOne,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('CartItem')
export class CartItem {
  @PrimaryGeneratedColumn({ name: 'cart_id', type: 'bigint' })
  cartId: string;

  @Column({ name: 'user_id', type: 'bigint', unique: true })
  userId: string;

  @Column({ name: 'product_id', type: 'bigint' }) 
  productId: string;

  @Column({ name: 'quantity', type: 'int', nullable: false }) 
  quantity: number; 
  
  @Column({ name: 'selected', type: 'boolean', default: false }) 
  selected: boolean;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.cartItems, { onDelete: 'CASCADE' }) 
  @JoinColumn({ name: 'user_id' }) 
  user: User;

  @ManyToOne(() => Product, (product) => product.cartItems, { onDelete: 'CASCADE' }) 
  @JoinColumn({ name: 'product_id' })
  product: Product;
}
