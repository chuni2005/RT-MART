import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
  UploadedFiles,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { QueryReviewDto } from './dto/query-review.dto';
import { JwtAccessGuard } from '../auth/guards/jwt-auth.guard';
import { FilesInterceptor } from '@nestjs/platform-express';
import type { AuthRequest } from '../common/types';

@Controller('review')
@UseInterceptors(ClassSerializerInterceptor)
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  @UseGuards(JwtAccessGuard)
  @UseInterceptors(FilesInterceptor('images'))
  async create(
    @Req() req: AuthRequest,
    @Body() createReviewDto: CreateReviewDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return await this.reviewService.create(
      req.user.userId,
      createReviewDto,
      files,
    );
  }

  @Get()
  async findAll(@Query() query: QueryReviewDto) {
    const { reviews, total } = await this.reviewService.findAll(query);
    return {
      success: true,
      message: '評價列表取得成功',
      reviews,
      total,
    };
  }

  @Get('statistics/:productId')
  async getStatistics(@Param('productId') productId: string) {
    const statistics = await this.reviewService.getStatistics(productId);
    return {
      success: true,
      message: '評價統計取得成功',
      statistics,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.reviewService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAccessGuard)
  async update(
    @Param('id') id: string,
    @Body() updateReviewDto: UpdateReviewDto,
  ) {
    return await this.reviewService.update(id, updateReviewDto);
  }

  @Delete(':id')
  @UseGuards(JwtAccessGuard)
  async remove(@Param('id') id: string) {
    return await this.reviewService.remove(id);
  }
}
