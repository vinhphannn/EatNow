import { Body, Controller, Get, Put, UseGuards, Req } from '@nestjs/common';
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
}


