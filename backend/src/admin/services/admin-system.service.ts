import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from '../../order/schemas/order.schema';
import { Driver, DriverDocument } from '../../driver/schemas/driver.schema';
import { RedisService } from '../../common/services/redis.service';
import { SmartDriverAssignmentService } from '../../driver/services/smart-driver-assignment.service';

@Injectable()
export class AdminSystemService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Driver.name) private driverModel: Model<DriverDocument>,
    private redisService: RedisService,
    private smartDriverAssignmentService: SmartDriverAssignmentService,
  ) {}

  /**
   * Lấy thống kê hệ thống gán đơn thông minh
   */
  async getSmartAssignmentStats() {
    try {
      // Lấy đơn hàng đang tìm tài xế (từ DB - không phụ thuộc Redis)
      const pendingOrdersInDb = await this.orderModel
        .find({ 
          driverId: { $in: [null, undefined] },
          status: { $nin: ['delivered', 'cancelled'] }
        })
        .select('_id')
        .lean();
      
      const pendingOrderIds = pendingOrdersInDb.map(o => String(o._id));
      
      // Lấy tài xế available từ DB
      const availableDriversInDb = await this.driverModel
        .find({ 
          status: 'available',
          currentOrderId: { $in: [null, undefined] }
        })
        .select('_id')
        .lean();
      
      const availableDriverIds = availableDriversInDb.map(d => String(d._id));
      
      // Lấy thống kê đơn hàng theo trạng thái
      const orderStats = await this.orderModel.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      // Lấy thống kê tài xế theo trạng thái
      const driverStats = await this.driverModel.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      // Lấy đơn hàng gần đây
      const recentOrders = await this.orderModel
        .find()
        .populate('customerId', 'name phone')
        .populate('restaurantId', 'name')
        .populate('driverId', 'name phone')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean() as any[];

      // Lấy tài xế hoạt động
      const activeDrivers = await this.driverModel
        .find({ status: { $in: ['available', 'delivering'] } })
        .select('name phone status currentOrderId activeOrdersCount rating')
        .limit(10)
        .lean() as any[];

      return {
        success: true,
        data: {
          smartAssignment: {
            pendingOrders: pendingOrderIds.length,
            availableDrivers: availableDriverIds.length,
            systemStatus: 'running'
          },
          orderStats: orderStats.reduce((acc, stat) => {
            acc[stat._id] = stat.count;
            return acc;
          }, {}),
          driverStats: driverStats.reduce((acc, stat) => {
            acc[stat._id] = stat.count;
            return acc;
          }, {}),
          recentOrders: recentOrders.map(order => {
            // Hiển thị driver name đúng
            let driverName = 'Chưa có tài xế';
            if (order.driverId) {
              if (typeof order.driverId === 'object' && order.driverId.name) {
                driverName = order.driverId.name;
              } else if (order.driverId) {
                driverName = 'Đã có tài xế';
              }
            }
            
            return {
              _id: order._id,
              code: order.orderNumber || order.code || String(order._id),
              customerName: order.customerId?.name || 'N/A',
              restaurantName: order.restaurantId?.name || 'N/A',
              driverName: driverName,
              total: order.finalTotal || order.total || 0,
              status: order.status,
              createdAt: order.createdAt
            };
          }),
          activeDrivers: activeDrivers.map(driver => ({
            _id: driver._id,
            name: driver.name,
            phone: driver.phone,
            status: driver.status,
            currentOrderId: driver.currentOrderId,
            activeOrdersCount: driver.activeOrdersCount || 0,
            rating: driver.rating || 4.0
          }))
        }
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Trigger manual smart assignment
   */
  async triggerSmartAssignment() {
    try {
      await this.smartDriverAssignmentService.processPendingOrders();
      
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

  /**
   * Lấy thông tin Redis
   */
  async getRedisInfo() {
    try {
      const pendingOrders = await this.redisService.getPendingOrders();
      const availableDrivers = await this.redisService.getAvailableDrivers();
      
      return {
        success: true,
        data: {
          pendingOrders: pendingOrders.length,
          availableDrivers: availableDrivers.length,
          pendingOrderIds: pendingOrders,
          availableDriverIds: availableDrivers,
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
}
