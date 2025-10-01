import { Controller, Get, Post, Put, Delete, Body, Query, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiQuery, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Review, ReviewDocument, ReviewType, ReviewStatus } from '../schemas/review.schema';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { UserRole } from '../../user/schemas/user.schema';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewController {
  constructor(
    @InjectModel(Review.name) private readonly reviewModel: Model<ReviewDocument>,
  ) {}

  // Public endpoints
  @Get('public')
  @ApiQuery({ name: 'type', required: false, enum: ReviewType })
  @ApiQuery({ name: 'restaurantId', required: false, type: String })
  @ApiQuery({ name: 'itemId', required: false, type: String })
  @ApiQuery({ name: 'driverId', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'rating', required: false, type: Number })
  @ApiQuery({ name: 'featured', required: false, type: Boolean })
  async findAllPublic(
    @Query('type') type?: ReviewType,
    @Query('restaurantId') restaurantId?: string,
    @Query('itemId') itemId?: string,
    @Query('driverId') driverId?: string,
    @Query('limit') limit?: number,
    @Query('skip') skip?: number,
    @Query('rating') rating?: number,
    @Query('featured') featured?: boolean,
  ) {
    const limitNum = limit ? Number(limit) : 20;
    const skipNum = skip ? Number(skip) : 0;

    const filter: any = { 
      status: ReviewStatus.APPROVED,
      isDeleted: false,
    };

    if (type) filter.type = type;
    if (restaurantId) filter.restaurantId = restaurantId;
    if (itemId) filter.itemId = itemId;
    if (driverId) filter.driverId = driverId;
    if (rating) filter.rating = rating;
    if (featured !== undefined) filter.isFeatured = featured;

    const [reviews, total] = await Promise.all([
      this.reviewModel
        .find(filter)
        .populate('userId', 'name avatarUrl')
        .sort({ 
          isFeatured: -1, 
          helpfulCount: -1, 
          createdAt: -1 
        })
        .skip(skipNum)
        .limit(limitNum)
        .lean(),
      this.reviewModel.countDocuments(filter),
    ]);

    return {
      reviews: reviews.map((review: any) => ({
        id: String(review._id),
        userId: String(review.userId._id),
        userName: review.userId.name,
        userAvatar: review.userId.avatarUrl,
        type: review.type,
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        foodQuality: review.foodQuality,
        serviceQuality: review.serviceQuality,
        deliverySpeed: review.deliverySpeed,
        packaging: review.packaging,
        valueForMoney: review.valueForMoney,
        imageUrls: review.imageUrls,
        helpfulCount: review.helpfulCount,
        unhelpfulCount: review.unhelpfulCount,
        response: review.response,
        responseAt: review.responseAt,
        isVerified: review.isVerified,
        isAnonymous: review.isAnonymous,
        createdAt: review.createdAt,
      })),
      pagination: {
        total,
        limit: limitNum,
        skip: skipNum,
        hasMore: total > skipNum + limitNum,
      },
    };
  }

  @Get('public/stats')
  @ApiQuery({ name: 'type', required: false, enum: ReviewType })
  @ApiQuery({ name: 'restaurantId', required: false, type: String })
  @ApiQuery({ name: 'itemId', required: false, type: String })
  @ApiQuery({ name: 'driverId', required: false, type: String })
  async getStats(
    @Query('type') type?: ReviewType,
    @Query('restaurantId') restaurantId?: string,
    @Query('itemId') itemId?: string,
    @Query('driverId') driverId?: string,
  ) {
    const filter: any = { 
      status: ReviewStatus.APPROVED,
      isDeleted: false,
    };

    if (type) filter.type = type;
    if (restaurantId) filter.restaurantId = restaurantId;
    if (itemId) filter.itemId = itemId;
    if (driverId) filter.driverId = driverId;

    const stats = await this.reviewModel.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          ratingDistribution: {
            $push: '$rating'
          },
          averageFoodQuality: { $avg: '$foodQuality' },
          averageServiceQuality: { $avg: '$serviceQuality' },
          averageDeliverySpeed: { $avg: '$deliverySpeed' },
          averagePackaging: { $avg: '$packaging' },
          averageValueForMoney: { $avg: '$valueForMoney' },
        }
      }
    ]);

    if (stats.length === 0) {
      return {
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        averageFoodQuality: 0,
        averageServiceQuality: 0,
        averageDeliverySpeed: 0,
        averagePackaging: 0,
        averageValueForMoney: 0,
      };
    }

    const stat = stats[0];
    const ratingDistribution = stat.ratingDistribution.reduce((acc: any, rating: number) => {
      acc[rating] = (acc[rating] || 0) + 1;
      return acc;
    }, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });

    return {
      totalReviews: stat.totalReviews,
      averageRating: Math.round(stat.averageRating * 10) / 10,
      ratingDistribution,
      averageFoodQuality: Math.round(stat.averageFoodQuality * 10) / 10,
      averageServiceQuality: Math.round(stat.averageServiceQuality * 10) / 10,
      averageDeliverySpeed: Math.round(stat.averageDeliverySpeed * 10) / 10,
      averagePackaging: Math.round(stat.averagePackaging * 10) / 10,
      averageValueForMoney: Math.round(stat.averageValueForMoney * 10) / 10,
    };
  }

  // User endpoints
  @Get('my-reviews')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getMyReviews(@Request() req: any) {
    const userId = req.user.id;

    const reviews = await this.reviewModel
      .find({ userId, isDeleted: false })
      .populate('restaurantId', 'name')
      .populate('itemId', 'name')
      .populate('orderId', 'code')
      .sort({ createdAt: -1 })
      .lean();

    return reviews.map((review: any) => ({
      id: String(review._id),
      type: review.type,
      rating: review.rating,
      title: review.title,
      comment: review.comment,
      restaurantName: review.restaurantId?.name,
      itemName: review.itemId?.name,
      orderCode: review.orderId?.code,
      status: review.status,
      isVerified: review.isVerified,
      helpfulCount: review.helpfulCount,
      response: review.response,
      responseAt: review.responseAt,
      createdAt: review.createdAt,
    }));
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async create(@Request() req: any, @Body() createReviewDto: any) {
    const userId = req.user.id;

    // Check if user already reviewed this item/restaurant
    const existingReview = await this.reviewModel.findOne({
      userId,
      type: createReviewDto.type,
      [createReviewDto.type === ReviewType.RESTAURANT ? 'restaurantId' : 'itemId']: 
        createReviewDto.type === ReviewType.RESTAURANT ? createReviewDto.restaurantId : createReviewDto.itemId,
      isDeleted: false,
    });

    if (existingReview) {
      return { message: 'You have already reviewed this item' };
    }

    const review = new this.reviewModel({
      ...createReviewDto,
      userId,
      status: ReviewStatus.PENDING,
      isVerified: createReviewDto.orderId ? true : false,
    });

    await review.save();

    return {
      id: String(review._id),
      message: 'Review submitted successfully and is pending approval',
    };
  }

  @Put(':id/helpful')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'id', type: String })
  async markHelpful(@Request() req: any, @Param('id') id: string) {
    const userId = req.user.id;

    const review = await this.reviewModel.findById(id);
    if (!review) {
      return { message: 'Review not found' };
    }

    // Check if user already marked this review
    const hasMarkedHelpful = review.helpfulUsers?.includes(userId);
    const hasMarkedUnhelpful = review.unhelpfulUsers?.includes(userId);

    if (hasMarkedHelpful) {
      // Remove helpful mark
      review.helpfulCount = Math.max(0, review.helpfulCount - 1);
      review.helpfulUsers = review.helpfulUsers?.filter(id => id.toString() !== userId);
    } else {
      // Add helpful mark
      review.helpfulCount += 1;
      if (!review.helpfulUsers) review.helpfulUsers = [];
      review.helpfulUsers.push(userId);

      // Remove unhelpful mark if exists
      if (hasMarkedUnhelpful) {
        review.unhelpfulCount = Math.max(0, review.unhelpfulCount - 1);
        review.unhelpfulUsers = review.unhelpfulUsers?.filter(id => id.toString() !== userId);
      }
    }

    await review.save();

    return {
      helpfulCount: review.helpfulCount,
      unhelpfulCount: review.unhelpfulCount,
      hasMarkedHelpful: !hasMarkedHelpful,
      hasMarkedUnhelpful: false,
    };
  }

  @Put(':id/unhelpful')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'id', type: String })
  async markUnhelpful(@Request() req: any, @Param('id') id: string) {
    const userId = req.user.id;

    const review = await this.reviewModel.findById(id);
    if (!review) {
      return { message: 'Review not found' };
    }

    const hasMarkedHelpful = review.helpfulUsers?.includes(userId);
    const hasMarkedUnhelpful = review.unhelpfulUsers?.includes(userId);

    if (hasMarkedUnhelpful) {
      // Remove unhelpful mark
      review.unhelpfulCount = Math.max(0, review.unhelpfulCount - 1);
      review.unhelpfulUsers = review.unhelpfulUsers?.filter(id => id.toString() !== userId);
    } else {
      // Add unhelpful mark
      review.unhelpfulCount += 1;
      if (!review.unhelpfulUsers) review.unhelpfulUsers = [];
      review.unhelpfulUsers.push(userId);

      // Remove helpful mark if exists
      if (hasMarkedHelpful) {
        review.helpfulCount = Math.max(0, review.helpfulCount - 1);
        review.helpfulUsers = review.helpfulUsers?.filter(id => id.toString() !== userId);
      }
    }

    await review.save();

    return {
      helpfulCount: review.helpfulCount,
      unhelpfulCount: review.unhelpfulCount,
      hasMarkedHelpful: false,
      hasMarkedUnhelpful: !hasMarkedUnhelpful,
    };
  }

  // Admin endpoints
  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  async findAllForAdmin(
    @Query('status') status?: ReviewStatus,
    @Query('type') type?: ReviewType,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const pageNum = page ? Number(page) : 1;
    const limitNum = limit ? Number(limit) : 20;
    const skip = (pageNum - 1) * limitNum;

    const filter: any = { isDeleted: false };
    if (status) filter.status = status;
    if (type) filter.type = type;

    const [reviews, total] = await Promise.all([
      this.reviewModel
        .find(filter)
        .populate('userId', 'name email')
        .populate('restaurantId', 'name')
        .populate('itemId', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      this.reviewModel.countDocuments(filter),
    ]);

    return {
      reviews: reviews.map((review: any) => ({
        id: String(review._id),
        userName: review.userId?.name,
        userEmail: review.userId?.email,
        restaurantName: review.restaurantId?.name,
        itemName: review.itemId?.name,
        type: review.type,
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        status: review.status,
        isVerified: review.isVerified,
        helpfulCount: review.helpfulCount,
        reportCount: review.reportCount,
        createdAt: review.createdAt,
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    };
  }

  @Put('admin/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiParam({ name: 'id', type: String })
  async updateStatus(@Param('id') id: string, @Body() body: { status: ReviewStatus, note?: string }) {
    const review = await this.reviewModel.findByIdAndUpdate(
      id,
      {
        status: body.status,
        moderatedAt: new Date(),
        moderationNote: body.note,
      },
      { new: true }
    );

    if (!review) {
      return { message: 'Review not found' };
    }

    return {
      id: String(review._id),
      status: review.status,
      message: 'Review status updated successfully',
    };
  }
}
