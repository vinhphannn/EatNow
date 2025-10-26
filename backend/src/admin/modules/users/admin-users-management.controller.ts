import { Controller, Get, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { AdminGuard } from '../../../auth/guards/admin.guard';
import { JwtAuthGuard } from '../../../auth/jwt-auth.guard';
import { PaginationInterceptor } from '../../../common/interceptors/pagination.interceptor';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { AdminUsersService } from './admin-users.service';

class UsersFilterDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

@Controller('admin/users')
@UseGuards(JwtAuthGuard, AdminGuard)
@UseInterceptors(PaginationInterceptor)
@ApiBearerAuth()
export class AdminUsersManagementController {
  constructor(
    private readonly service: AdminUsersService,
  ) {}

  @Get('customers')
  async getCustomers(@Query() query: UsersFilterDto) {
    return this.service.list({ ...query, role: 'customer' } as any);
  }

  @Get('restaurants')
  async getRestaurants(@Query() query: UsersFilterDto) {
    return this.service.list({ ...query, role: 'restaurant' } as any);
  }

  @Get('drivers')
  async getDrivers(@Query() query: UsersFilterDto) {
    return this.service.list({ ...query, role: 'driver' } as any);
  }
}



