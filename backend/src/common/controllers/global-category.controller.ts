import { Controller, Get, Post, Put, Delete, Query, Param, Body, UseGuards, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiQuery, ApiParam, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GlobalCategory, GlobalCategoryDocument } from '../schemas/global-category.schema';
import { CreateGlobalCategoryDto, UpdateGlobalCategoryDto } from '../dto/global-category.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';
import { UserRole } from '../../user/schemas/user.schema';

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

  // Test route
  @Get('test')
  async testRoute() {
    return { message: 'Global categories controller is working!' };
  }

  // Admin CRUD endpoints
  @Get('admin')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(UserRole.ADMIN)
  // @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy danh sách tất cả global categories (Admin)' })
  async getAllCategoriesAdmin(
    @Query('limit') limit?: number,
    @Query('skip') skip?: number,
    @Query('search') search?: string,
  ) {
    const limitNum = limit ? Number(limit) : 50;
    const skipNum = skip ? Number(skip) : 0;

    const filter: any = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } },
      ];
    }

    const [categories, total] = await Promise.all([
      this.globalCategoryModel
        .find(filter)
        .sort({ position: 1, createdAt: -1 })
        .skip(skipNum)
        .limit(limitNum)
        .lean(),
      this.globalCategoryModel.countDocuments(filter),
    ]);

    return {
      categories: categories.map((cat: any) => ({
        id: String(cat._id),
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        imageUrl: cat.imageUrl,
        icon: cat.icon,
        position: cat.position,
        isActive: cat.isActive,
        isVisible: cat.isVisible,
        isFeatured: cat.isFeatured,
        tags: cat.tags || [],
        restaurantCount: cat.restaurantCount || 0,
        orderCount: cat.orderCount || 0,
        popularityScore: cat.popularityScore || 0,
        viewCount: cat.viewCount || 0,
        clickCount: cat.clickCount || 0,
        conversionRate: cat.conversionRate || 0,
        parentCategoryId: cat.parentCategoryId,
        level: cat.level || 0,
        createdAt: cat.createdAt,
        updatedAt: cat.updatedAt,
      })),
      total,
      limit: limitNum,
      skip: skipNum,
    };
  }

  @Get('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy chi tiết global category (Admin)' })
  async getCategoryByIdAdmin(@Param('id') id: string) {
    const category = await this.globalCategoryModel.findById(id).lean();
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return {
      id: String(category._id),
      name: category.name,
      slug: category.slug,
      description: category.description,
      imageUrl: category.imageUrl,
      icon: category.icon,
      position: category.position,
      isActive: category.isActive,
      isVisible: category.isVisible,
      isFeatured: category.isFeatured,
      tags: category.tags || [],
      metaTitle: category.metaTitle,
      metaDescription: category.metaDescription,
      keywords: category.keywords || [],
      parentCategoryId: category.parentCategoryId,
      level: category.level || 0,
      restaurantCount: category.restaurantCount || 0,
      orderCount: category.orderCount || 0,
      popularityScore: category.popularityScore || 0,
      viewCount: category.viewCount || 0,
      clickCount: category.clickCount || 0,
      conversionRate: category.conversionRate || 0,
        createdAt: (category as any).createdAt,
        updatedAt: (category as any).updatedAt,
    };
  }

  @Post('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo global category mới (Admin)' })
  async createCategory(@Body() createCategoryDto: CreateGlobalCategoryDto) {
    // Generate slug if not provided
    if (!createCategoryDto.slug) {
      createCategoryDto.slug = createCategoryDto.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }

    // Check if slug already exists
    const existingCategory = await this.globalCategoryModel.findOne({ slug: createCategoryDto.slug });
    if (existingCategory) {
      createCategoryDto.slug = `${createCategoryDto.slug}-${Date.now()}`;
    }

    const category = new this.globalCategoryModel({
      ...createCategoryDto,
      level: createCategoryDto.parentCategoryId ? 1 : 0,
    });

    const savedCategory = await category.save();
    return {
      id: String(savedCategory._id),
      name: savedCategory.name,
      slug: savedCategory.slug,
      description: savedCategory.description,
      imageUrl: savedCategory.imageUrl,
      icon: savedCategory.icon,
      position: savedCategory.position,
      isActive: savedCategory.isActive,
      isVisible: savedCategory.isVisible,
      isFeatured: savedCategory.isFeatured,
      tags: savedCategory.tags || [],
      parentCategoryId: savedCategory.parentCategoryId,
      level: savedCategory.level,
      createdAt: (savedCategory as any).createdAt,
      updatedAt: (savedCategory as any).updatedAt,
    };
  }

  @Put('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật global category (Admin)' })
  async updateCategory(@Param('id') id: string, @Body() updateCategoryDto: UpdateGlobalCategoryDto) {
    const category = await this.globalCategoryModel.findById(id);
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Generate slug if not provided and name is being updated
    if (updateCategoryDto.name && !updateCategoryDto.slug) {
      updateCategoryDto.slug = updateCategoryDto.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      
      // Check if slug already exists (excluding current category)
      const existingCategory = await this.globalCategoryModel.findOne({ 
        slug: updateCategoryDto.slug,
        _id: { $ne: id }
      });
      if (existingCategory) {
        updateCategoryDto.slug = `${updateCategoryDto.slug}-${Date.now()}`;
      }
    }

    // Update level if parentCategoryId is being changed
    if (updateCategoryDto.parentCategoryId !== undefined) {
      updateCategoryDto.level = updateCategoryDto.parentCategoryId ? 1 : 0;
    }

    const updatedCategory = await this.globalCategoryModel.findByIdAndUpdate(
      id,
      updateCategoryDto,
      { new: true, runValidators: true }
    );

    return {
      id: String(updatedCategory._id),
      name: updatedCategory.name,
      slug: updatedCategory.slug,
      description: updatedCategory.description,
      imageUrl: updatedCategory.imageUrl,
      icon: updatedCategory.icon,
      position: updatedCategory.position,
      isActive: updatedCategory.isActive,
      isVisible: updatedCategory.isVisible,
      isFeatured: updatedCategory.isFeatured,
      tags: updatedCategory.tags || [],
      parentCategoryId: updatedCategory.parentCategoryId,
      level: updatedCategory.level,
      createdAt: (updatedCategory as any).createdAt,
      updatedAt: (updatedCategory as any).updatedAt,
    };
  }

  @Delete('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xóa global category (Admin)' })
  async deleteCategory(@Param('id') id: string) {
    const category = await this.globalCategoryModel.findById(id);
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    await this.globalCategoryModel.findByIdAndDelete(id);
    return { message: 'Category deleted successfully' };
  }
}