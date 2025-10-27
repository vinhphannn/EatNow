import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { JwtAuthGuard } from '../../../auth/jwt-auth.guard';
import { AdminGuard } from '../../../auth/guards/admin.guard';
import { PaginationInterceptor } from '../../../common/interceptors/pagination.interceptor';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { AdminDriversService } from './admin-drivers.service';
import { DriverAutoSimService } from '../../../driver/services/driver-auto-sim.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DriverAdminLog, DriverAdminLogDocument } from './admin-driver-log.schema';

class DriversFilterDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  status?: string;
}

@Controller('admin/drivers')
@UseGuards(JwtAuthGuard, AdminGuard)
@UseInterceptors(PaginationInterceptor)
@ApiBearerAuth()
export class AdminDriversController {
  constructor(
    private readonly service: AdminDriversService,
    private readonly autoSim: DriverAutoSimService,
    @InjectModel(DriverAdminLog.name) private readonly logModel: Model<DriverAdminLogDocument>,
  ) {}

  @Get()
  async list(@Query() query: DriversFilterDto) {
    return this.service.list(query as any);
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: { status?: string; isAuto?: boolean }) {
    return this.service.update(id, body);
  }

  @Post(':id/auto')
  async toggleAuto(@Param('id') id: string, @Body() body: { enable: boolean }) {
    const res = await this.service.update(id, { isAuto: !!body?.enable });
    if (body?.enable) await this.autoSim.start(id); else this.autoSim.stop(id);
    return res;
  }

  @Post(':id/warn')
  async warn(@Param('id') id: string, @Body() body: { message: string }, @Query('adminId') adminId?: string) {
    await this.logModel.create({ driverId: id as any, adminId: adminId as any, action: 'WARN', reason: body?.message });
    return { ok: true };
  }

  @Post(':id/notes')
  async note(@Param('id') id: string, @Body() body: { note: string }, @Query('adminId') adminId?: string) {
    await this.logModel.create({ driverId: id as any, adminId: adminId as any, action: 'NOTE', reason: body?.note });
    return { ok: true };
  }

  @Get(':id/logs')
  async logs(@Param('id') id: string) {
    const docs = await this.logModel.find({ driverId: id as any }).sort({ createdAt: -1 }).limit(10).lean();
    return docs.map((d: any) => ({ id: String(d._id), action: d.action, reason: d.reason, createdAt: d.createdAt }));
  }

  @Get('stats/overview')
  async getOverviewStats() {
    return this.service.getOverviewStats();
  }
}


