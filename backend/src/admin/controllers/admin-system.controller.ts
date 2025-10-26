import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { AdminSystemService } from '../services/admin-system.service';

@Controller('admin/system')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminSystemController {
  constructor(private adminSystemService: AdminSystemService) {}

  @Get('smart-assignment')
  async getSmartAssignmentStats() {
    return await this.adminSystemService.getSmartAssignmentStats();
  }

  @Post('smart-assignment/trigger')
  async triggerSmartAssignment() {
    return await this.adminSystemService.triggerSmartAssignment();
  }

  @Get('redis-info')
  async getRedisInfo() {
    return await this.adminSystemService.getRedisInfo();
  }
}
