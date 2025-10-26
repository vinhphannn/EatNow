import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsMongoId, IsEnum } from 'class-validator';

export class CreateItemOptionSeparateDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsMongoId()
  @IsNotEmpty()
  itemId: string;

  @ApiProperty({ example: 'Size' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'single', enum: ['single', 'multiple'] })
  @IsEnum(['single', 'multiple'])
  @IsNotEmpty()
  type: 'single' | 'multiple';

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  required?: boolean;

  @ApiPropertyOptional({ example: 1 })
  @IsNumber()
  @IsOptional()
  position?: number;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateItemOptionSeparateDto {
  @ApiPropertyOptional({ example: 'Size' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'single', enum: ['single', 'multiple'] })
  @IsEnum(['single', 'multiple'])
  @IsOptional()
  type?: 'single' | 'multiple';

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  required?: boolean;

  @ApiPropertyOptional({ example: 1 })
  @IsNumber()
  @IsOptional()
  position?: number;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

