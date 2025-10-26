import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsNumber, IsArray, IsUrl, Min, Max } from 'class-validator';

export class CreateGlobalCategoryDto {
  @ApiProperty({ description: 'Tên danh mục' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Mô tả danh mục' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Icon (emoji hoặc class CSS)' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ description: 'URL hình ảnh' })
  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Vị trí sắp xếp', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  position?: number;

  @ApiPropertyOptional({ description: 'Có hoạt động không', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Tags' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Slug URL' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ description: 'Meta title cho SEO' })
  @IsOptional()
  @IsString()
  metaTitle?: string;

  @ApiPropertyOptional({ description: 'Meta description cho SEO' })
  @IsOptional()
  @IsString()
  metaDescription?: string;

  @ApiPropertyOptional({ description: 'Keywords cho SEO' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];

  @ApiPropertyOptional({ description: 'ID danh mục cha' })
  @IsOptional()
  @IsString()
  parentCategoryId?: string;

  @ApiPropertyOptional({ description: 'Có hiển thị không', default: true })
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;

  @ApiPropertyOptional({ description: 'Có nổi bật không', default: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;
}

export class UpdateGlobalCategoryDto {
  @ApiPropertyOptional({ description: 'Tên danh mục' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Mô tả danh mục' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Icon (emoji hoặc class CSS)' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ description: 'URL hình ảnh' })
  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Vị trí sắp xếp' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  position?: number;

  @ApiPropertyOptional({ description: 'Có hoạt động không' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Tags' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Slug URL' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ description: 'Meta title cho SEO' })
  @IsOptional()
  @IsString()
  metaTitle?: string;

  @ApiPropertyOptional({ description: 'Meta description cho SEO' })
  @IsOptional()
  @IsString()
  metaDescription?: string;

  @ApiPropertyOptional({ description: 'Keywords cho SEO' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];

  @ApiPropertyOptional({ description: 'ID danh mục cha' })
  @IsOptional()
  @IsString()
  parentCategoryId?: string;

  @ApiPropertyOptional({ description: 'Có hiển thị không' })
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;

  @ApiPropertyOptional({ description: 'Có nổi bật không' })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({ description: 'Level của danh mục' })
  @IsOptional()
  @IsNumber()
  level?: number;
}
