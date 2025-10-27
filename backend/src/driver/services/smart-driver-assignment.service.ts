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

      // Validate input
      if (!orderId || typeof orderId !== 'string') {
        this.logger.error('Invalid orderId provided');
        return null;
      }

      // Lấy thông tin đơn hàng
      const order = await this.orderModel.findById(orderId).lean();
      if (!order) {
        this.logger.error(`Order not found: ${orderId}`);
        await this.redisService.removePendingOrder(orderId); // Cleanup
        return null;
      }

      // Kiểm tra đơn hàng có hợp lệ không
      if (!order.restaurantCoordinates?.latitude || !order.restaurantCoordinates?.longitude) {
        this.logger.error(`Order ${orderId} missing restaurant coordinates`);
        await this.redisService.removePendingOrder(orderId); // Cleanup
        return null;
      }

      // CHỈ TÌM TÀI XẾ CHO ĐƠN CHƯA CÓ TÀI XẾ
      if (order.driverId) {
        this.logger.log(`Order ${orderId} already has driver: ${order.driverId}`);
        // Xóa khỏi pending orders
        await this.redisService.removePendingOrder(orderId);
        return null;
      }

      // Kiểm tra đơn hàng có đang trong trạng thái hợp lệ không
      if (['delivered', 'cancelled'].includes(order.status)) {
        this.logger.warn(`Order ${orderId} is in final state: ${order.status}`);
        await this.redisService.removePendingOrder(orderId); // Cleanup
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
      // Validate input
      if (!driverId || !order) {
        this.logger.warn('Invalid driverId or order in evaluateDriver');
        return null;
      }

      // Lấy thông tin tài xế
      const driver = await this.driverModel.findById(driverId).lean();
      if (!driver) {
        this.logger.warn(`Driver not found: ${driverId}`);
        return null;
      }

      // Kiểm tra tài xế có available không
      if (driver.status !== 'checkin') {
        this.logger.debug(`Driver ${driverId} not checked in: ${driver.status}`);
        return null;
      }
      
      // Kiểm tra tài xế có đang giao hàng không
      if (driver.deliveryStatus === 'delivering') {
        this.logger.debug(`Driver ${driverId} is already delivering`);
        return null;
      }

      // Kiểm tra tài xế có đơn hàng hiện tại không
      if (driver.currentOrderId) {
        this.logger.debug(`Driver ${driverId} has current order: ${driver.currentOrderId}`);
        return null;
      }

      // Lấy vị trí hiện tại của tài xế
      const location = await this.redisService.getDriverLocation(driverId);
      if (!location || !location.lat || !location.lng) {
        this.logger.warn(`No valid location data for driver: ${driverId}`);
        return null;
      }

      // Tính khoảng cách đến nhà hàng
      const distance = this.calculateDistance(
        location.lat, location.lng,
        order.restaurantCoordinates?.latitude || 0,
        order.restaurantCoordinates?.longitude || 0
      );

      // Kiểm tra khoảng cách tối đa (10km)
      if (distance > 10) {
        this.logger.debug(`Driver ${driverId} too far: ${distance.toFixed(2)}km`);
        return null;
      }

      // Kiểm tra tài xế có đạt yêu cầu tối thiểu không
      const minRating = 3.0;
      const driverRating = driver.rating || 0;
      if (driverRating < minRating) {
        this.logger.debug(`Driver ${driverId} rating too low: ${driverRating}`);
        return null;
      }

      return {
        driverId,
        distance,
        rating: driverRating,
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
   * Lấy danh sách tài xế available (kết hợp cache và DB để đảm bảo chính xác)
   */
  private async getAvailableDrivers(): Promise<string[]> {
    try {
      // Lấy từ database để đảm bảo chính xác
      const drivers = await this.driverModel
        .find({ 
          status: 'checkin',
          deliveryStatus: { $in: [null, undefined] },
          currentOrderId: { $in: [null, undefined] }
        })
        .select('_id')
        .lean();

      const driverIds = drivers.map(d => d._id.toString());
      
      // Cập nhật cache với dữ liệu mới nhất
      await this.updateAvailableDriversCache(driverIds);

      this.logger.debug(`Found ${driverIds.length} available drivers from DB`);
      return driverIds;

    } catch (error) {
      this.logger.error('Error getting available drivers:', error);
      // Fallback: lấy từ cache nếu có
      const cachedDrivers = await this.redisService.getAvailableDrivers();
      this.logger.warn(`Using cached drivers as fallback: ${cachedDrivers.length}`);
      return cachedDrivers;
    }
  }

  /**
   * Cập nhật cache available drivers
   */
  private async updateAvailableDriversCache(driverIds: string[]): Promise<void> {
    try {
      // Xóa cache cũ
      const cachedDrivers = await this.redisService.getAvailableDrivers();
      for (const driverId of cachedDrivers) {
        await this.redisService.removeAvailableDriver(driverId);
      }

      // Thêm cache mới
      for (const driverId of driverIds) {
        await this.redisService.addAvailableDriver(driverId);
      }
    } catch (error) {
      this.logger.error('Error updating available drivers cache:', error);
    }
  }

  /**
   * Gán đơn hàng cho tài xế (atomic operation để tránh race condition)
   */
  async assignOrderToDriver(orderId: string, driverId: string): Promise<boolean> {
    try {
      this.logger.log(`Assigning order ${orderId} to driver ${driverId}`);

      // ATOMIC UPDATE: Chỉ cập nhật nếu đơn hàng chưa có tài xế
      const orderUpdateResult = await this.orderModel.findOneAndUpdate(
        { 
          _id: orderId, 
          driverId: { $in: [null, undefined] } // Chỉ gán nếu chưa có tài xế
        },
        {
          driverId: new Types.ObjectId(driverId),
          status: 'picking_up',
          assignedAt: new Date()
        },
        { new: true }
      );

      if (!orderUpdateResult) {
        this.logger.warn(`Order ${orderId} already has driver or not found`);
        return false;
      }

      // ATOMIC UPDATE: Chỉ cập nhật nếu tài xế đang available
      const driverUpdateResult = await this.driverModel.findOneAndUpdate(
        { 
          _id: driverId,
          status: 'checkin',
          deliveryStatus: { $in: [null, undefined] },
          currentOrderId: { $in: [null, undefined] }
        },
        {
          deliveryStatus: 'delivering',
          currentOrderId: new Types.ObjectId(orderId),
          currentOrderStartedAt: new Date(),
          $inc: { activeOrdersCount: 1 }
        },
        { new: true }
      );

      if (!driverUpdateResult) {
        this.logger.warn(`Driver ${driverId} is not available for assignment`);
        // Rollback order update
        await this.orderModel.findByIdAndUpdate(orderId, {
          driverId: null,
          status: 'ready',
          assignedAt: null
        });
        return false;
      }

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
