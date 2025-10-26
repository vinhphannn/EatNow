import { IsString, IsOptional, IsBoolean, IsNumber, IsArray, IsDateString, IsIn } from 'class-validator';

export class CreateFeaturedCollectionDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  subtitle?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  position?: number;

  @IsOptional()
  @IsIn(['grid', 'carousel', 'list'])
  layout?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  // Personalization strategy
  @IsOptional()
  @IsString()
  mainCriteria?: string; // e.g., 'highRated', 'bestSellers', 'trending', 'new', 'discount'

  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @IsOptional()
  @IsDateString()
  validUntil?: string;
}

export class UpdateFeaturedCollectionDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  subtitle?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  position?: number;

  @IsOptional()
  @IsIn(['grid', 'carousel', 'list'])
  layout?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsString()
  mainCriteria?: string;

  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @IsOptional()
  @IsDateString()
  validUntil?: string;
}
