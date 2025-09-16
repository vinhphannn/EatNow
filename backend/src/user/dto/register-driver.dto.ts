import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MinLength, IsOptional, IsString, IsEnum } from 'class-validator';

export class RegisterDriverDto {
  @ApiProperty({ example: 'driver@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ minLength: 6, example: 'secret123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'Tài xế A' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: '0901234567' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'A123456789' })
  @IsString()
  @IsNotEmpty()
  licenseNumber: string;

  @ApiProperty({ example: 'motorcycle', enum: ['motorcycle', 'bicycle', 'car'] })
  @IsEnum(['motorcycle', 'bicycle', 'car'])
  vehicleType: string;

  @ApiProperty({ example: '51A-12345' })
  @IsString()
  @IsNotEmpty()
  vehicleNumber: string;
}


