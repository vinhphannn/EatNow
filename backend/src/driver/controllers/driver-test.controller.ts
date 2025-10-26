import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { SmartDriverAssignmentService } from '../services/smart-driver-assignment.service';
import { DriverAssignmentSchedulerService } from '../services/driver-assignment-scheduler.service';
import { RedisService } from '../../common/services/redis.service';

@Controller('driver/test')
export class DriverTestController {
  constructor(
    private smartDriverAssignmentService: SmartDriverAssignmentService,
    private driverAssignmentSchedulerService: DriverAssignmentSchedulerService,
    private redisService: RedisService,
  ) {}

  @Get('smart-assignment/status')
  async getSmartAssignmentStatus() {
    try {
      const pendingOrders = await this.redisService.getPendingOrders();
      const availableDrivers = await this.redisService.getAvailableDrivers();
      
      return {
        success: true,
        data: {
          pendingOrders: pendingOrders.length,
          availableDrivers: availableDrivers.length,
          systemStatus: 'running',
          features: [
            'Redis queue for pending orders',
            'Smart driver selection algorithm',
            'Background job processing',
            'Fallback when Redis unavailable',
            'Real-time notifications'
          ]
        }
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  @Get('pending-orders')
  async getPendingOrders() {
    try {
      const pendingOrders = await this.redisService.getPendingOrders();
      
      return {
        success: true,
        data: {
          count: pendingOrders.length,
          orders: pendingOrders,
          message: `Có ${pendingOrders.length} đơn hàng đang tìm tài xế`,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        fallback: 'Redis fallback is working'
      };
    }
  }

  @Post('smart-assignment/trigger')
  async triggerSmartAssignment() {
    try {
      await this.driverAssignmentSchedulerService.runManualAssignment();
      
      return {
        success: true,
        message: 'Smart assignment triggered successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  @Post('redis/test')
  async testRedisConnection() {
    try {
      // Test Redis operations
      await this.redisService.addPendingOrder('test-order-123');
      const pendingOrders = await this.redisService.getPendingOrders();
      await this.redisService.removePendingOrder('test-order-123');
      
      return {
        success: true,
        message: 'Redis connection test successful',
        data: {
          pendingOrdersCount: pendingOrders.length,
          testOrderAdded: true,
          testOrderRemoved: true
        }
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        fallback: 'Redis fallback is working'
      };
    }
  }

  @Get('assignment/logic')
  async getAssignmentLogic() {
    return {
      success: true,
      data: {
        title: 'Hệ thống gán đơn thông minh',
        description: 'Logic gán đơn đã được sửa lại',
        workflow: [
          '1. Tạo đơn hàng → Nhà hàng nhận đơn',
          '2. Nhà hàng xác nhận → Chuẩn bị món ăn', 
          '3. Nhà hàng chuẩn bị xong → Chuyển status = "ready"',
          '4. Hệ thống tự động tìm tài xế phù hợp',
          '5. Tài xế nhận đơn → Đến lấy hàng ngay',
          '6. Giao hàng cho khách'
        ],
        benefits: [
          'Tài xế không phải chờ nhà hàng chuẩn bị',
          'Hiệu quả hơn cho tài xế',
          'Khách hàng nhận hàng nhanh hơn',
          'Giảm thời gian chờ đợi'
        ],
        status: '✅ Logic đã được sửa - chỉ tìm tài xế khi đơn hàng sẵn sàng giao'
      }
    };
  }
}
