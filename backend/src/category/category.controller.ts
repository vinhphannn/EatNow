import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CategoryService } from './category.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@ApiTags('categories')
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách tất cả categories' })
  async getAllCategories() {
    return this.categoryService.findAll();
  }

  @Get('public')
  @ApiOperation({ summary: 'Lấy danh sách categories công khai (cho frontend)' })
  async getPublicCategories() {
    return this.categoryService.findPublicCategories();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin category theo ID' })
  async getCategoryById(@Param('id') id: string) {
    return this.categoryService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'restaurant')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo category mới (Admin/Restaurant)' })
  async createCategory(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoryService.create(createCategoryDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'restaurant')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật category (Admin/Restaurant)' })
  async updateCategory(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto
  ) {
    return this.categoryService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'restaurant')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xóa category (Admin/Restaurant)' })
  async deleteCategory(@Param('id') id: string) {
    return this.categoryService.delete(id);
  }

  @Post('seed-default')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo default categories (Admin only)' })
  async seedDefaultCategories() {
    return this.categoryService.seedDefaultCategories();
  }
}
