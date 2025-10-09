import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { UserDto } from '../../user/dto/user.dto';
import { UserRole } from '../../user/schemas/user.schema';

export class LoginRequestDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'Nguyen Van A' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '0123456789', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ enum: Object.values(UserRole) })
  @IsEnum(UserRole)
  role: UserRole;
}

export class LoginResponseDto {
  @ApiProperty({ example: 'jwt-access-token' })
  access_token: string;

  @ApiProperty({ type: UserDto })
  user: UserDto;
}

export class RefreshResponseDto {
  @ApiProperty({ example: 'jwt-access-token' })
  access_token: string;
}


