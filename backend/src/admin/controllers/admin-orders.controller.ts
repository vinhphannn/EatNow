import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { AdminOrdersService } from '../admin-orders.service';

@Controller('admin/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminOrdersController {
  constructor(private adminOrdersService: AdminOrdersService) {}

  @Get()
  async listOrders(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('paymentStatus') paymentStatus?: string,
    @Query('restaurantId') restaurantId?: string,
    @Query('driverId') driverId?: string,
    @Query('customerId') customerId?: string
  ) {
    return await this.adminOrdersService.listOrders({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      status,
      paymentStatus,
      restaurantId,
      driverId,
      customerId
    });
  }
}
