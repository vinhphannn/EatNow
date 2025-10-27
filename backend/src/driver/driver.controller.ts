import { Body, Controller, Get, Put, UseGuards, Req, Patch, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DriverService } from './driver.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('drivers')
@Controller('drivers')
export class DriverController {
  constructor(private readonly driverService: DriverService) {}

  @Get()
  async findAll() {
    return this.driverService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('mine/wallet')
  async getMyWallet(@Req() req: any) {
    const userId = req.user?.id;
    return this.driverService.getWalletForUser(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Put('me/location')
  async updateMyLocation(@Req() req: any, @Body() body: { lat: number; lng: number }) {
    return this.driverService.updateLocationByUser(req.user?.id, body.lat, body.lng);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/stats')
  async getMyStats(@Req() req: any) {
    return this.driverService.getDriverStats(req.user?.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/current-orders')
  async getMyCurrentOrders(@Req() req: any) {
    return this.driverService.getCurrentOrders(req.user?.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMyProfile(@Req() req: any) {
    return this.driverService.getMyProfile(req.user?.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  async updateMyProfile(
    @Req() req: any,
    @Body() body: {
      name?: string;
      phone?: string;
      vehicleType?: string;
      licensePlate?: string;
      bankAccount?: string;
      bankName?: string;
    }
  ) {
    return this.driverService.updateMyProfile(req.user?.id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/earnings/summary')
  async getEarningsSummary(@Req() req: any) {
    return this.driverService.getEarningsSummary(req.user?.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/earnings')
  async getEarnings(
    @Req() req: any,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.driverService.getEarnings(req.user?.id, {
      page: parseInt(page as any, 10) || 1,
      limit: Math.min(parseInt(limit as any, 10) || 20, 100),
      fromDate,
      toDate,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/history')
  async getOrderHistory(
    @Req() req: any,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('status') status?: string
  ) {
    return this.driverService.getOrderHistory(req.user?.id, {
      page: parseInt(page as any, 10) || 1,
      limit: Math.min(parseInt(limit as any, 10) || 20, 100),
      status,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/status')
  async getMyStatus(@Req() req: any) {
    return this.driverService.getDriverStatus(req.user?.id);
  }
}


