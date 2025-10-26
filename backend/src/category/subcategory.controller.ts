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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SubCategoryService } from './subcategory.service';
import { CreateSubCategoryDto, UpdateSubCategoryDto } from './dto/subcategory.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('SubCategories')
@Controller('subcategories')
export class SubCategoryController {
  constructor(private readonly subCategoryService: SubCategoryService) {}

  @Get()
  @ApiOperation({ summary: 'Get all active subcategories' })
  @ApiResponse({ status: 200, description: 'List of subcategories' })
  async findAll(@Query('categoryId') categoryId?: string) {
    if (categoryId) {
      return this.subCategoryService.findByCategoryId(categoryId);
    }
    return this.subCategoryService.findAll();
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get subcategory by slug' })
  @ApiResponse({ status: 200, description: 'Subcategory found' })
  @ApiResponse({ status: 404, description: 'Subcategory not found' })
  async findBySlug(@Param('slug') slug: string) {
    return this.subCategoryService.findBySlug(slug);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get subcategory by ID' })
  @ApiResponse({ status: 200, description: 'Subcategory found' })
  @ApiResponse({ status: 404, description: 'Subcategory not found' })
  async findOne(@Param('id') id: string) {
    return this.subCategoryService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'restaurant')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new subcategory' })
  @ApiResponse({ status: 201, description: 'Subcategory created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'Subcategory with this slug already exists' })
  async create(@Body() createSubCategoryDto: CreateSubCategoryDto) {
    return this.subCategoryService.create(createSubCategoryDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'restaurant')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update subcategory' })
  @ApiResponse({ status: 200, description: 'Subcategory updated successfully' })
  @ApiResponse({ status: 404, description: 'Subcategory not found' })
  @ApiResponse({ status: 409, description: 'Subcategory with this slug already exists' })
  async update(
    @Param('id') id: string,
    @Body() updateSubCategoryDto: UpdateSubCategoryDto,
  ) {
    return this.subCategoryService.update(id, updateSubCategoryDto);
  }

  @Patch(':id/position')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'restaurant')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update subcategory position' })
  @ApiResponse({ status: 200, description: 'Subcategory position updated successfully' })
  @ApiResponse({ status: 404, description: 'Subcategory not found' })
  async updatePosition(
    @Param('id') id: string,
    @Body('position') position: number,
  ) {
    return this.subCategoryService.updatePosition(id, position);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'restaurant')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete subcategory' })
  @ApiResponse({ status: 200, description: 'Subcategory deleted successfully' })
  @ApiResponse({ status: 404, description: 'Subcategory not found' })
  async remove(@Param('id') id: string) {
    await this.subCategoryService.delete(id);
    return { message: 'SubCategory deleted successfully' };
  }

  @Post('seed')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Seed default subcategories' })
  @ApiResponse({ status: 201, description: 'Default subcategories created successfully' })
  async seedDefault() {
    return this.subCategoryService.seedDefaultSubCategories();
  }
}
