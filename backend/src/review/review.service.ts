import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { Review } from './entities/review.entity';
import { ReviewImage } from './entities/review-image.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { ProductsService } from '../products/products.service';
import { QueryReviewDto } from './dto/query-review.dto';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    @InjectRepository(ReviewImage)
    private readonly imageRepository: Repository<ReviewImage>,
    private readonly cloudinaryService: CloudinaryService,
    private readonly productsService: ProductsService,
  ) {}

  async create(
    userId: string,
    createReviewDto: CreateReviewDto,
    files: Express.Multer.File[],
  ) {
    // 1. Create review
    const review = this.reviewRepository.create({
      ...createReviewDto,
      userId,
    });
    const savedReview = await this.reviewRepository.save(review);

    // 2. Handle image uploads
    if (files && files.length > 0) {
      const images = await Promise.all(
        files.map(async (file, index) => {
          const result = await this.cloudinaryService.uploadImage(file);
          if (!result.url || !result.publicId) {
            throw new BadRequestException('Cloudinary upload failed');
          }
          return this.imageRepository.create({
            reviewId: savedReview.reviewId,
            imageUrl: result.url,
            publicId: result.publicId,
            displayOrder: index + 1,
          });
        }),
      );
      await this.imageRepository.save(images);
    }

    // 3. Update product rating
    await this.productsService.updateRating(
      createReviewDto.productId,
      createReviewDto.rating,
    );

    return this.findOne(savedReview.reviewId);
  }

  async findAll(query: QueryReviewDto) {
    const {
      productId,
      page = '1',
      limit = '10',
      minRating,
      sortBy = 'createdAt',
      order = 'DESC',
    } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const queryBuilder = this.reviewRepository
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.user', 'user')
      .leftJoinAndSelect('review.images', 'images')
      .where('review.productId = :productId', { productId });

    if (minRating) {
      queryBuilder.andWhere('review.rating >= :minRating', {
        minRating: parseInt(minRating),
      });
    }

    queryBuilder
      .orderBy(`review.${sortBy}`, order.toUpperCase() as 'ASC' | 'DESC')
      .skip(skip)
      .take(parseInt(limit));

    const [reviews, total] = await queryBuilder.getManyAndCount();
    return { reviews, total };
  }

  async findOne(id: string) {
    const review = await this.reviewRepository.findOne({
      where: { reviewId: id },
      relations: ['user', 'images'],
    });
    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }
    return review;
  }

  async getStatistics(productId: string) {
    const stats = await this.reviewRepository
      .createQueryBuilder('review')
      .select('review.rating', 'rating')
      .addSelect('COUNT(*)', 'count')
      .where('review.productId = :productId', { productId })
      .groupBy('review.rating')
      .getRawMany();

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalScore = 0;
    let totalCount = 0;

    stats.forEach((s) => {
      const r = parseInt(s.rating);
      const c = parseInt(s.count);
      distribution[r] = c;
      totalScore += r * c;
      totalCount += c;
    });

    return {
      average:
        totalCount > 0 ? Math.round((totalScore / totalCount) * 10) / 10 : 0,
      total: totalCount,
      distribution,
    };
  }

  async update(id: string, updateReviewDto: UpdateReviewDto) {
    const review = await this.findOne(id);
    this.reviewRepository.merge(review, updateReviewDto);
    return this.reviewRepository.save(review);
  }

  async remove(id: string) {
    const review = await this.findOne(id);
    return this.reviewRepository.remove(review);
  }
}
