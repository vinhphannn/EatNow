import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsMongoId } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Món Việt Nam' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'mon-viet-nam' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiPropertyOptional({ example: 'Món ăn truyền thống Việt Nam' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: '🍜' })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional({ example: 'from-orange-400 to-red-500' })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsNumber()
  @IsOptional()
  position?: number;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 'https://example.com/image.jpg' })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439011' })
  @IsMongoId()
  @IsOptional()
  restaurantId?: string;
}

export class UpdateCategoryDto {
  @ApiPropertyOptional({ example: 'Món Việt Nam' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'mon-viet-nam' })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiPropertyOptional({ example: 'Món ăn truyền thống Việt Nam' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: '🍜' })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional({ example: 'from-orange-400 to-red-500' })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsNumber()
  @IsOptional()
  position?: number;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 'https://example.com/image.jpg' })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439011' })
  @IsMongoId()
  @IsOptional()
  restaurantId?: string;
}
