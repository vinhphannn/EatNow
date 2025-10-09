import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { IsOptional, IsString } from 'class-validator';
import { AdminGuard } from '../auth/guards/admin.guard';
import { PaginationInterceptor } from '../common/interceptors/pagination.interceptor';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminUsersService } from './admin-users.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserAdminLog, UserAdminLogDocument } from './admin-user-log.schema';

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
export class AdminUsersController {
  constructor(
    private readonly service: AdminUsersService,
    @InjectModel(UserAdminLog.name) private readonly logModel: Model<UserAdminLogDocument>,
  ) {}

  @Get()
  async list(@Query() query: UsersFilterDto) {
    return this.service.list(query as any);
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: { isActive?: boolean }) {
    return this.service.update(id, body);
  }

  @Post(':id/warn')
  async warn(@Param('id') id: string, @Body() body: { message: string }, @Query('adminId') adminId?: string) {
    await this.logModel.create({ userId: id as any, adminId: adminId as any, action: 'WARN', reason: body?.message });
    return { ok: true };
  }

  @Post(':id/notes')
  async note(@Param('id') id: string, @Body() body: { note: string }, @Query('adminId') adminId?: string) {
    await this.logModel.create({ userId: id as any, adminId: adminId as any, action: 'NOTE', reason: body?.note });
    return { ok: true };
  }

  @Get(':id/logs')
  async logs(@Param('id') id: string) {
    const docs = await this.logModel.find({ userId: id as any }).sort({ createdAt: -1 }).limit(10).lean();
    return docs.map((d: any) => ({ id: String(d._id), action: d.action, reason: d.reason, createdAt: d.createdAt }));
  }
}


