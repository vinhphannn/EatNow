import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

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

export class UserDto {
  @ApiProperty({ example: '65f2b6c8e1a2b3c4d5e6f7a8' })
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'customer', enum: ['admin', 'customer', 'restaurant', 'driver'] })
  role: string;

  @ApiProperty({ example: 'Nguyen Van A' })
  name?: string;

  @ApiProperty({ required: false, example: 'https://...' })
  avatar?: string;
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


