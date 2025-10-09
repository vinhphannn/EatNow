import { Body, Controller, Get, Param, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { IsOptional, IsString } from 'class-validator';
import { PaginationInterceptor } from '../common/interceptors/pagination.interceptor';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { AdminGuard } from '../auth/guards/admin.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminRestaurantsService } from './admin-restaurants.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RestaurantAdminLog, RestaurantAdminLogDocument } from './admin-restaurant-log.schema';

class RestaurantFilterDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  city?: string;
}

@Controller('admin/restaurants')
@UseGuards(JwtAuthGuard, AdminGuard)
@UseInterceptors(PaginationInterceptor)
export class AdminRestaurantsController {
  constructor(
    private readonly service: AdminRestaurantsService,
    @InjectModel(RestaurantAdminLog.name) private readonly logModel: Model<RestaurantAdminLogDocument>,
  ) {}

  @Get()
  async list(@Query() query: RestaurantFilterDto) {
    return this.service.list(query as any);
  }

  @Post(':id/warn')
  async warn(@Param('id') id: string, @Body() body: { message: string }, @Query('adminId') adminId?: string) {
    await this.logModel.create({ restaurantId: id as any, adminId: adminId as any, action: 'WARN', reason: body?.message });
    return { ok: true };
  }

  @Post(':id/notes')
  async note(@Param('id') id: string, @Body() body: { note: string }, @Query('adminId') adminId?: string) {
    await this.logModel.create({ restaurantId: id as any, adminId: adminId as any, action: 'NOTE', reason: body?.note });
    return { ok: true };
  }

  @Get(':id/logs')
  async logs(@Param('id') id: string) {
    const docs = await this.logModel.find({ restaurantId: id as any }).sort({ createdAt: -1 }).limit(10).lean();
    return docs.map((d: any) => ({ id: String(d._id), action: d.action, reason: d.reason, createdAt: d.createdAt }));
  }
}


