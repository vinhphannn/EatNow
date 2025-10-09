import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, IsUrl } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Nguyen Van A' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: '0123456789' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'https://...' })
  @IsUrl({ require_tld: false }, { message: 'avatarUrl must be a valid URL' })
  @IsOptional()
  avatarUrl?: string;

  @ApiPropertyOptional({ type: [Object] })
  @IsArray()
  @IsOptional()
  addresses?: any[];

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsOptional()
  addressLabels?: string[];
}


