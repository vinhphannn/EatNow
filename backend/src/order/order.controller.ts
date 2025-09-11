import { Controller, Get, Post, Put, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrderService } from './order.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OrderStatus } from './schemas/order.schema';

@ApiTags('orders')
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new order' })
  async createOrder(@Request() req, @Body() orderData: any) {
    const customerId = req.user.id;
    return this.orderService.createOrder(customerId, orderData);
  }

  @Get('customer')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get customer orders' })
  async getCustomerOrders(@Request() req) {
    const customerId = req.user.id;
    return this.orderService.getOrdersByCustomer(customerId);
  }

  @Get('restaurant')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get restaurant orders' })
  async getRestaurantOrders(@Request() req) {
    const userId = req.user.id;
    // Find restaurant by ownerUserId
    const restaurant = await this.orderService.findRestaurantByOwnerId(userId);
    if (!restaurant) {
      throw new Error('Restaurant not found for this user');
    }
    return this.orderService.getOrdersByRestaurant(String(restaurant._id));
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get order by ID' })
  async getOrderById(@Param('id') orderId: string) {
    return this.orderService.getOrderById(orderId);
  }

  @Put(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update order status' })
  async updateOrderStatus(
    @Param('id') orderId: string,
    @Body() body: { status: OrderStatus; driverId?: string }
  ) {
    return this.orderService.updateOrderStatus(orderId, body.status, body.driverId);
  }

  @Get('stats/restaurant')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get restaurant order statistics' })
  async getRestaurantStats(@Request() req) {
    const userId = req.user.id;
    const restaurant = await this.orderService.findRestaurantByOwnerId(userId);
    if (!restaurant) {
      throw new Error('Restaurant not found for this user');
    }
    return this.orderService.getOrderStats(String(restaurant._id));
  }
}
