import { Controller, Post, Body, UseGuards, Request, Logger } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { DriverLocationService } from '../services/driver-location.service';
import { DriverPerformanceService } from '../services/driver-performance.service';

@Controller('driver/location')
@UseGuards(JwtAuthGuard)
export class DriverLocationController {
  private readonly logger = new Logger(DriverLocationController.name);

  constructor(
    private readonly driverLocationService: DriverLocationService,
    private readonly driverPerformanceService: DriverPerformanceService,
  ) {}

  @Post('update')
  async updateLocation(
    @Request() req: any,
    @Body() body: { latitude: number; longitude: number }
  ) {
    try {
      const driverId = req.user.id;
      const { latitude, longitude } = body;

      // Validate coordinates
      if (!latitude || !longitude || 
          latitude < -90 || latitude > 90 || 
          longitude < -180 || longitude > 180) {
        return {
          success: false,
          message: 'Invalid coordinates'
        };
      }

      // Update driver location
      await this.driverLocationService.updateDriverLocation(
        driverId,
        latitude,
        longitude
      );

      // Recalculate performance score
      await this.driverPerformanceService.calculatePerformanceScore(driverId);

      this.logger.log(`Driver ${driverId} location updated: ${latitude}, ${longitude}`);

      return {
        success: true,
        message: 'Location updated successfully',
        timestamp: new Date()
      };
    } catch (error) {
      this.logger.error('Failed to update driver location:', error);
      return {
        success: false,
        message: 'Failed to update location'
      };
    }
  }

  @Post('status')
  async updateStatus(
    @Request() req: any,
    @Body() body: { isOnline: boolean }
  ) {
    try {
      const driverId = req.user.id;
      const { isOnline } = body;

      await this.driverLocationService.setDriverStatus(driverId, isOnline);

      return {
        success: true,
        message: `Driver status updated to ${isOnline ? 'online' : 'offline'}`,
        isOnline
      };
    } catch (error) {
      this.logger.error('Failed to update driver status:', error);
      return {
        success: false,
        message: 'Failed to update status'
      };
    }
  }
}
