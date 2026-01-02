import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Review } from './review.entity';

@Entity('ReviewImage')
@Index(['reviewId'])
export class ReviewImage {
  @PrimaryGeneratedColumn({ name: 'review_image_id', type: 'bigint' })
  reviewImageId: string;

  @Column({ name: 'review_id', type: 'bigint' })
  reviewId: string;

  @Column({ name: 'image_url', type: 'varchar', length: 500, nullable: true })
  imageUrl: string;

  @Column({ name: 'public_id', type: 'varchar', length: 50, nullable: true })
  publicId: string;

  @Column({ name: 'display_order', type: 'int', default: 1 })
  displayOrder: number;

  // Relations
  @ManyToOne(() => Review, (review) => review.images, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'review_id' })
  review: Review;
}
