import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Driver } from '../schemas/driver.schema';
import { Order } from '../../order/schemas/order.schema';
import { RedisService } from '../../common/services/redis.service';
import { OptimizedNotificationGateway } from '../../notification/optimized-notification.gateway';

interface DriverCandidate {
  driverId: string;
  distance: number;
  rating: number;
  activeOrdersCount: number;
  isAvailable: boolean;
  location?: { lat: number; lng: number };
}

@Injectable()
export class SmartDriverAssignmentService {
  private readonly logger = new Logger(SmartDriverAssignmentService.name);

  constructor(
    @InjectModel(Driver.name) private driverModel: Model<Driver>,
    @InjectModel(Order.name) private orderModel: Model<Order>,
    private redisService: RedisService,
    private notificationGateway: OptimizedNotificationGateway,
  ) {}

  /**
   * Tìm tài xế phù hợp nhất cho đơn hàng
   */
  async findBestDriverForOrder(orderId: string): Promise<string | null> {
    try {
      this.logger.log(`🔍 Finding best driver for order: ${orderId}`);

      // Lấy thông tin đơn hàng
      const order = await this.orderModel.findById(orderId).lean();
      if (!order) {
        this.logger.error(`Order not found: ${orderId}`);
        return null;
      }

      // CHỈ TÌM TÀI XẾ CHO ĐƠN CHƯA CÓ TÀI XẾ
      if (order.driverId) {
        this.logger.log(`Order ${orderId} already has driver: ${order.driverId}`);
        // Xóa khỏi pending orders
        await this.redisService.removePendingOrder(orderId);
        return null;
      }

      // Lấy tất cả tài xế available
      const availableDrivers = await this.getAvailableDrivers();
      if (availableDrivers.length === 0) {
        this.logger.warn('No available drivers found');
        return null;
      }

      // Tính toán điểm số cho từng tài xế
      const candidates: DriverCandidate[] = [];
      
      for (const driverId of availableDrivers) {
        const candidate = await this.evaluateDriver(driverId, order);
        if (candidate) {
          candidates.push(candidate);
        }
      }

      if (candidates.length === 0) {
        this.logger.warn('No suitable drivers found');
        return null;
      }

      // Sắp xếp theo điểm số (cao nhất trước)
      candidates.sort((a, b) => this.calculateScore(b) - this.calculateScore(a));

      const bestDriver = candidates[0];
      this.logger.log(`Best driver found: ${bestDriver.driverId} with score: ${this.calculateScore(bestDriver)}`);

      return bestDriver.driverId;

    } catch (error) {
      this.logger.error('Error finding best driver:', error);
      return null;
    }
  }

  /**
   * Đánh giá tài xế dựa trên nhiều tiêu chí
   */
  private async evaluateDriver(driverId: string, order: any): Promise<DriverCandidate | null> {
    try {
      // Lấy thông tin tài xế
      const driver = await this.driverModel.findById(driverId).lean();
      if (!driver) return null;

      // Kiểm tra tài xế có available không
      if (driver.status !== 'available') return null;

      // Lấy vị trí hiện tại của tài xế
      const location = await this.redisService.getDriverLocation(driverId);
      if (!location) {
        this.logger.warn(`No location data for driver: ${driverId}`);
        return null;
      }

      // Tính khoảng cách đến nhà hàng
      const distance = this.calculateDistance(
        location.lat, location.lng,
        order.restaurantId?.coordinates?.lat || 0,
        order.restaurantId?.coordinates?.lng || 0
      );

      // Kiểm tra khoảng cách tối đa (10km)
      if (distance > 10) return null;

      return {
        driverId,
        distance,
        rating: driver.rating || 4.0,
        activeOrdersCount: driver.activeOrdersCount || 0,
        isAvailable: true,
        location
      };

    } catch (error) {
      this.logger.error(`Error evaluating driver ${driverId}:`, error);
      return null;
    }
  }

  /**
   * Tính điểm số tổng hợp cho tài xế
   */
  private calculateScore(candidate: DriverCandidate): number {
    // Trọng số cho từng tiêu chí
    const distanceWeight = 0.4;    // Khoảng cách (càng gần càng tốt)
    const ratingWeight = 0.3;      // Đánh giá (càng cao càng tốt)
    const workloadWeight = 0.3;    // Tải công việc (càng ít càng tốt)

    // Chuẩn hóa khoảng cách (0-10km -> 0-1, càng gần càng cao)
    const distanceScore = Math.max(0, 1 - (candidate.distance / 10));

    // Chuẩn hóa rating (0-5 -> 0-1)
    const ratingScore = candidate.rating / 5;

    // Chuẩn hóa workload (0-5 đơn -> 0-1, càng ít càng cao)
    const workloadScore = Math.max(0, 1 - (candidate.activeOrdersCount / 5));

    // Tính điểm tổng hợp
    const totalScore = 
      distanceScore * distanceWeight +
      ratingScore * ratingWeight +
      workloadScore * workloadWeight;

    return totalScore;
  }

  /**
   * Lấy danh sách tài xế available
   */
  private async getAvailableDrivers(): Promise<string[]> {
    // Lấy từ Redis cache trước
    const cachedDrivers = await this.redisService.getAvailableDrivers();
    if (cachedDrivers.length > 0) {
      return cachedDrivers;
    }

    // Nếu không có cache, lấy từ database
    const drivers = await this.driverModel
      .find({ status: 'available' })
      .select('_id')
      .lean();

    const driverIds = drivers.map(d => d._id.toString());
    
    // Cache vào Redis
    for (const driverId of driverIds) {
      await this.redisService.addAvailableDriver(driverId);
    }

    return driverIds;
  }

  /**
   * Gán đơn hàng cho tài xế
   */
  async assignOrderToDriver(orderId: string, driverId: string): Promise<boolean> {
    try {
      this.logger.log(`Assigning order ${orderId} to driver ${driverId}`);

      // Cập nhật đơn hàng
      await this.orderModel.findByIdAndUpdate(orderId, {
        driverId: new Types.ObjectId(driverId),
        status: 'picking_up',
        assignedAt: new Date()
      });

      // Cập nhật tài xế
      await this.driverModel.findByIdAndUpdate(driverId, {
        status: 'delivering',
        currentOrderId: new Types.ObjectId(orderId),
        currentOrderStartedAt: new Date(),
        $inc: { activeOrdersCount: 1 }
      });

      // Xóa khỏi pending orders
      await this.redisService.removePendingOrder(orderId);

      // Xóa khỏi available drivers
      await this.redisService.removeAvailableDriver(driverId);

      // Cache assignment
      await this.redisService.setOrderAssignment(orderId, driverId);

      // Gửi notification cho tài xế
      this.notificationGateway.notifyDriverAssigned(driverId, {
        orderId,
        message: 'Bạn có đơn hàng mới!'
      });

      this.logger.log(`Order ${orderId} successfully assigned to driver ${driverId}`);
      return true;

    } catch (error) {
      this.logger.error(`Error assigning order ${orderId} to driver ${driverId}:`, error);
      return false;
    }
  }

  /**
   * Xử lý tất cả đơn hàng pending
   */
  async processPendingOrders(): Promise<void> {
    try {
      const pendingOrders = await this.redisService.getPendingOrders();
      this.logger.log(`Processing ${pendingOrders.length} pending orders`);

      for (const orderId of pendingOrders) {
        const bestDriver = await this.findBestDriverForOrder(orderId);
        
        if (bestDriver) {
          const success = await this.assignOrderToDriver(orderId, bestDriver);
          if (success) {
            this.logger.log(`Order ${orderId} assigned to driver ${bestDriver}`);
          }
        } else {
          this.logger.warn(`No suitable driver found for order ${orderId}`);
        }
      }

    } catch (error) {
      this.logger.error('Error processing pending orders:', error);
    }
  }

  /**
   * Tính khoảng cách giữa 2 điểm (Haversine formula)
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Bán kính Trái Đất (km)
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
