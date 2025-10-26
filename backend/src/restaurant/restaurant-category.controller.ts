import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RestaurantCategoryService } from './restaurant-category.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@ApiTags('restaurant-categories')
@Controller('restaurant-categories')
export class RestaurantCategoryController {
  constructor(private readonly restaurantCategoryService: RestaurantCategoryService) {}

  @Get('restaurant/:restaurantId')
  @ApiOperation({ summary: 'Lấy danh sách categories của restaurant' })
  async getRestaurantCategories(@Param('restaurantId') restaurantId: string) {
    return this.restaurantCategoryService.findAll(restaurantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin restaurant category theo ID' })
  async getRestaurantCategoryById(@Param('id') id: string) {
    return this.restaurantCategoryService.findById(id);
  }

  @Post('restaurant/:restaurantId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'restaurant')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo restaurant category mới' })
  async createRestaurantCategory(
    @Param('restaurantId') restaurantId: string,
    @Body() createData: {
      name: string;
      slug: string;
      description?: string;
      icon?: string;
      color?: string;
      position?: number;
      isActive?: boolean;
      imageUrl?: string;
    }
  ) {
    return this.restaurantCategoryService.create(restaurantId, createData);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'restaurant')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật restaurant category' })
  async updateRestaurantCategory(
    @Param('id') id: string,
    @Body() updateData: {
      name?: string;
      slug?: string;
      description?: string;
      icon?: string;
      color?: string;
      position?: number;
      isActive?: boolean;
      imageUrl?: string;
    }
  ) {
    return this.restaurantCategoryService.update(id, updateData);
  }

  @Patch(':id/position')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'restaurant')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật vị trí restaurant category' })
  async updateRestaurantCategoryPosition(
    @Param('id') id: string,
    @Body('position') position: number
  ) {
    return this.restaurantCategoryService.updatePosition(id, position);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'restaurant')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xóa restaurant category' })
  async deleteRestaurantCategory(@Param('id') id: string) {
    return this.restaurantCategoryService.delete(id);
  }

  @Post('restaurant/:restaurantId/seed-default')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'restaurant')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo default restaurant categories' })
  async seedDefaultRestaurantCategories(@Param('restaurantId') restaurantId: string) {
    return this.restaurantCategoryService.seedDefaultRestaurantCategories(restaurantId);
  }
}
