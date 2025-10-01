import { Controller, Get, Query, Param } from '@nestjs/common';
import { ApiTags, ApiQuery, ApiParam } from '@nestjs/swagger';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GlobalCategory, GlobalCategoryDocument } from '../schemas/global-category.schema';

@ApiTags('global-categories')
@Controller('global-categories')
export class GlobalCategoryController {
  constructor(
    @InjectModel(GlobalCategory.name) private readonly globalCategoryModel: Model<GlobalCategoryDocument>,
  ) {}

  @Get('public')
  @ApiQuery({ name: 'featured', required: false, type: Boolean })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  async getPublicCategories(
    @Query('featured') featured?: boolean,
    @Query('limit') limit?: number,
    @Query('skip') skip?: number,
  ) {
    const limitNum = limit ? Number(limit) : 50;
    const skipNum = skip ? Number(skip) : 0;

    const filter: any = { isActive: true, isVisible: true };
    if (featured !== undefined) {
      filter.isFeatured = featured;
    }

    const [categories, total] = await Promise.all([
      this.globalCategoryModel
        .find(filter, {
          name: 1,
          slug: 1,
          description: 1,
          imageUrl: 1,
          icon: 1,
          position: 1,
          isFeatured: 1,
          restaurantCount: 1,
          orderCount: 1,
          popularityScore: 1,
        })
        .sort({ position: 1, popularityScore: -1 })
        .skip(skipNum)
        .limit(limitNum)
        .lean(),
      this.globalCategoryModel.countDocuments(filter),
    ]);

    // If no categories exist, return fallback data
    if (categories.length === 0) {
      return [
        {
          id: "demo-1",
          name: "Pizza",
          slug: "pizza",
          description: "Pizza Ý truyền thống và hiện đại",
          icon: "🍕",
          position: 1,
          isFeatured: true,
          restaurantCount: 12,
          orderCount: 45,
          popularityScore: 95,
        },
        {
          id: "demo-2", 
          name: "Đồ ăn nhanh",
          slug: "fast-food",
          description: "Burger, gà rán và các món ăn nhanh",
          icon: "🍔",
          position: 2,
          isFeatured: true,
          restaurantCount: 8,
          orderCount: 32,
          popularityScore: 88,
        },
        {
          id: "demo-3",
          name: "Món Việt", 
          slug: "vietnamese",
          description: "Ẩm thực truyền thống Việt Nam",
          icon: "🍜",
          position: 3,
          isFeatured: true,
          restaurantCount: 15,
          orderCount: 67,
          popularityScore: 92,
        },
        {
          id: "demo-4",
          name: "Món Á",
          slug: "asian", 
          description: "Ẩm thực châu Á đa dạng",
          icon: "🥢",
          position: 4,
          isFeatured: false,
          restaurantCount: 10,
          orderCount: 54,
          popularityScore: 78,
        },
        {
          id: "demo-5",
          name: "Món Tây",
          slug: "western",
          description: "Ẩm thực phương Tây cao cấp", 
          icon: "🍽️",
          position: 5,
          isFeatured: false,
          restaurantCount: 6,
          orderCount: 28,
          popularityScore: 65,
        },
        {
          id: "demo-6",
          name: "Tráng miệng",
          slug: "desserts",
          description: "Bánh ngọt, kem và đồ tráng miệng",
          icon: "🍰", 
          position: 6,
          isFeatured: false,
          restaurantCount: 4,
          orderCount: 18,
          popularityScore: 55,
        },
      ];
    }

    return categories.map((cat: any) => ({
      id: String(cat._id),
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      imageUrl: cat.imageUrl,
      icon: cat.icon,
      position: cat.position,
      isFeatured: cat.isFeatured,
      restaurantCount: cat.restaurantCount || 0,
      orderCount: cat.orderCount || 0,
      popularityScore: cat.popularityScore || 0,
    }));
  }

  @Get('public/popular')
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getPopularCategories(@Query('limit') limit?: number) {
    const limitNum = limit ? Number(limit) : 10;

    const categories = await this.globalCategoryModel
        .find({ isActive: true, isVisible: true }, {
          name: 1,
          slug: 1,
          description: 1,
          imageUrl: 1,
          icon: 1,
          position: 1,
          isFeatured: 1,
          restaurantCount: 1,
          orderCount: 1,
          popularityScore: 1,
        })
      .sort({ popularityScore: -1, restaurantCount: -1 })
      .limit(limitNum)
      .lean();

    return categories.map((cat: any) => ({
      id: String(cat._id),
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      imageUrl: cat.imageUrl,
      icon: cat.icon,
      position: cat.position,
      isFeatured: cat.isFeatured,
      restaurantCount: cat.restaurantCount || 0,
      orderCount: cat.orderCount || 0,
      popularityScore: cat.popularityScore || 0,
    }));
  }

  @Get('public/:slug')
  @ApiParam({ name: 'slug', type: String })
  async getCategoryBySlug(@Param('slug') slug: string) {
    const category = await this.globalCategoryModel
        .findOne({ slug, isActive: true, isVisible: true }, {
          name: 1,
          slug: 1,
          description: 1,
          imageUrl: 1,
          icon: 1,
          position: 1,
          isFeatured: 1,
          restaurantCount: 1,
          orderCount: 1,
          popularityScore: 1,
        })
      .lean();

    if (!category) {
      return null;
    }

    return {
      id: String(category._id),
      name: category.name,
      slug: category.slug,
      description: category.description,
      imageUrl: category.imageUrl,
      icon: category.icon,
      position: category.position,
      isFeatured: category.isFeatured,
      restaurantCount: category.restaurantCount || 0,
      orderCount: category.orderCount || 0,
      popularityScore: category.popularityScore || 0,
    };
  }
}