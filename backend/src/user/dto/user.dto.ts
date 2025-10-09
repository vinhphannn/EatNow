import { ApiProperty } from '@nestjs/swagger';

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


