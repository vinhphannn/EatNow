import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Driver, DriverDocument } from '../schemas/driver.schema';
import { Order, OrderDocument, OrderStatus } from '../../order/schemas/order.schema';
import { DistanceService } from '../../common/services/distance.service';

/**
 * Smart Assignment Algorithm
 * 
 * Chức năng:
 * 1. Tìm kiếm drivers phù hợp nhất cho một đơn hàng
 * 2. Tính điểm dựa trên: khoảng cách, performance, workload
 * 3. Ưu tiên driver gần nhất, có performance tốt, tải thấp
 * 
 * Công thức tính điểm:
 * score = (distance_weight * (1 - normalized_distance)) 
 *       + (performance_weight * normalized_performance)
 *       + (workload_weight * (1 - normalized_workload))
 */

interface DriverCandidate {
  driver: DriverDocument;
  distanceToRestaurant: number; // km
  estimatedPickupTime: number; // minutes
  estimatedDeliveryTime: number; // minutes
  totalTime: number; // minutes
  score: number; // Final assignment score
}

@Injectable()
export class SmartAssignmentService {
  private readonly logger = new Logger(SmartAssignmentService.name);

  // Weights for score calculation
  private readonly DISTANCE_WEIGHT = 0.4; // Ưu tiên driver gần
  private readonly PERFORMANCE_WEIGHT = 0.35; // Ưu tiên performance cao
  private readonly WORKLOAD_WEIGHT = 0.25; // Ưu tiên tải thấp

  constructor(
    @InjectModel(Driver.name) private readonly driverModel: Model<DriverDocument>,
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    private readonly distanceService: DistanceService,
  ) {}

  /**
   * Tìm driver phù hợp nhất cho đơn hàng
   */
  async findBestDriverForOrder(orderId: string): Promise<DriverCandidate | null> {
    try {
      const order = await this.orderModel.findById(orderId).lean();
      if (!order) {
        this.logger.error(`Order ${orderId} not found`);
        return null;
      }

      // Lấy thông tin nhà hàng
      const restaurantLat = order.restaurantCoordinates?.latitude || order.deliveryAddress?.latitude;
      const restaurantLon = order.restaurantCoordinates?.longitude || order.deliveryAddress?.longitude;

      if (!restaurantLat || !restaurantLon) {
        this.logger.error(`Order ${orderId} missing restaurant location`);
        return null;
      }

      // Tìm drivers available trong phạm vi
      const availableDrivers = await this.findAvailableDriversInRange(
        restaurantLat,
        restaurantLon,
        10 // 10km radius
      );

      if (availableDrivers.length === 0) {
        this.logger.warn(`No available drivers found for order ${orderId}`);
        return null;
      }

      // Tính điểm cho từng driver
      const candidates = await Promise.all(
        availableDrivers.map(async (driver) => {
          const candidate = await this.evaluateDriverForOrder(driver, order);
          return candidate;
        })
      );

      // Sắp xếp theo điểm số giảm dần
      candidates.sort((a, b) => b.score - a.score);

      this.logger.log(
        `Found ${candidates.length} drivers, best: ${candidates[0]?.driver._id} (score: ${candidates[0]?.score.toFixed(2)})`
      );

      return candidates[0] || null;

    } catch (error) {
      this.logger.error(`Failed to find best driver for order ${orderId}:`, error);
      return null;
    }
  }

  /**
   * Tìm drivers available trong phạm vi
   */
  private async findAvailableDriversInRange(
    lat: number,
    lon: number,
    radiusKm: number
  ): Promise<DriverDocument[]> {
    try {
      // Tìm drivers có status = available và có location
      const drivers = await this.driverModel
        .find({
          status: 'available',
          location: { $exists: true, $ne: [0, 0] },
          // Đơn đang giao < max concurrent orders
          $expr: {
            $lt: ['$activeOrdersCount', '$maxConcurrentOrders']
          }
        })
        .lean();

      // Lọc theo khoảng cách
      const nearbyDrivers = drivers.filter((driver) => {
        if (!driver.location || driver.location.length !== 2) return false;
        
        const [driverLon, driverLat] = driver.location;
        const distance = this.distanceService.calculateHaversine(
          lat,
          lon,
          driverLat,
          driverLon
        );
        
        return distance <= radiusKm;
      });

      this.logger.log(
        `Found ${nearbyDrivers.length} available drivers in ${radiusKm}km radius`
      );

      return nearbyDrivers as DriverDocument[];

    } catch (error) {
      this.logger.error('Failed to find available drivers in range:', error);
      return [];
    }
  }

  /**
   * Đánh giá driver cho đơn hàng cụ thể
   */
  private async evaluateDriverForOrder(
    driver: DriverDocument,
    order: any
  ): Promise<DriverCandidate> {
    const [driverLon, driverLat] = driver.location || [0, 0];
    
    const restaurantLat = order.restaurantCoordinates?.latitude || order.deliveryAddress?.latitude;
    const restaurantLon = order.restaurantCoordinates?.longitude || order.deliveryAddress?.longitude;
    
    const customerLat = order.deliveryAddress?.latitude;
    const customerLon = order.deliveryAddress?.longitude;

    // Tính khoảng cách đến nhà hàng
    const distanceToRestaurant = this.distanceService.calculateHaversine(
      driverLat,
      driverLon,
      restaurantLat,
      restaurantLon
    );

    // Tính thời gian ước tính (giả sử 30km/h trung bình)
    const estimatedPickupTime = (distanceToRestaurant / 30) * 60; // minutes

    // Tính khoảng cách từ nhà hàng đến khách hàng
    const restaurantToCustomerDistance = this.distanceService.calculateHaversine(
      restaurantLat,
      restaurantLon,
      customerLat,
      customerLon
    );

    // Tính tổng thời gian
    const estimatedDeliveryTime = (restaurantToCustomerDistance / 30) * 60; // minutes
    const totalTime = estimatedPickupTime + estimatedDeliveryTime;

    // Tính điểm số
    const score = this.calculateDriverScore(
      driver,
      distanceToRestaurant,
      estimatedPickupTime,
      totalTime
    );

    return {
      driver: driver as DriverDocument,
      distanceToRestaurant,
      estimatedPickupTime,
      estimatedDeliveryTime,
      totalTime,
      score
    };
  }

  /**
   * Tính điểm số cho driver
   */
  private calculateDriverScore(
    driver: DriverDocument,
    distanceToRestaurant: number,
    estimatedPickupTime: number,
    totalTime: number
  ): number {
    // Normalize distance (khuyến khích driver gần) - max 10km
    const maxDistance = 10;
    const normalizedDistance = Math.min(distanceToRestaurant / maxDistance, 1);
    const distanceScore = this.DISTANCE_WEIGHT * (1 - normalizedDistance);

    // Normalize performance (0-100)
    const maxPerformance = 100;
    const performanceScore = this.PERFORMANCE_WEIGHT * (driver.performanceScore / maxPerformance);

    // Normalize workload (khuyến khích tải thấp)
    const maxConcurrentOrders = driver.maxConcurrentOrders || 3;
    const normalizedWorkload = driver.activeOrdersCount / maxConcurrentOrders;
    const workloadScore = this.WORKLOAD_WEIGHT * (1 - normalizedWorkload);

    // Bonus cho rating cao và đơn hoàn thành nhiều
    const ratingBonus = driver.rating > 4 ? 0.05 : driver.rating > 3 ? 0.02 : 0;
    const experienceBonus = driver.totalDeliveries > 100 ? 0.05 : driver.totalDeliveries > 50 ? 0.02 : 0;

    const totalScore = distanceScore + performanceScore + workloadScore + ratingBonus + experienceBonus;

    return totalScore;
  }

  /**
   * Tự động gán đơn cho driver phù hợp nhất
   */
  async autoAssignOrder(orderId: string): Promise<boolean> {
    try {
      const candidate = await this.findBestDriverForOrder(orderId);
      
      if (!candidate) {
        this.logger.warn(`No suitable driver found for order ${orderId}`);
        return false;
      }

      // Gán đơn cho driver
      const result = await this.assignOrderToDriver(orderId, candidate.driver._id.toString());

      if (result) {
        this.logger.log(
          `Order ${orderId} auto-assigned to driver ${candidate.driver._id} with score ${candidate.score.toFixed(2)}`
        );
      }

      return result;

    } catch (error) {
      this.logger.error(`Failed to auto-assign order ${orderId}:`, error);
      return false;
    }
  }

  /**
   * Gán đơn cho driver cụ thể
   */
  async assignOrderToDriver(orderId: string, driverId: string): Promise<boolean> {
    try {
      const driver = await this.driverModel.findById(driverId);
      if (!driver) {
        this.logger.error(`Driver ${driverId} not found`);
        return false;
      }

      const order = await this.orderModel.findById(orderId);
      if (!order) {
        this.logger.error(`Order ${orderId} not found`);
        return false;
      }

      // Cập nhật đơn hàng
      await this.orderModel.findByIdAndUpdate(orderId, {
        driverId: new Types.ObjectId(driverId),
        status: OrderStatus.READY,
        assignedAt: new Date()
      });

      // Cập nhật driver
      await this.driverModel.findByIdAndUpdate(driverId, {
        status: 'delivering',
        currentOrderId: new Types.ObjectId(orderId),
        currentOrderStartedAt: new Date(),
        $inc: { activeOrdersCount: 1 }
      });

      this.logger.log(`Order ${orderId} assigned to driver ${driverId}`);
      return true;

    } catch (error) {
      this.logger.error(`Failed to assign order ${orderId} to driver ${driverId}:`, error);
      return false;
    }
  }

  /**
   * Cập nhật vị trí driver
   */
  async updateDriverLocation(driverId: string, latitude: number, longitude: number): Promise<boolean> {
    try {
      await this.driverModel.findByIdAndUpdate(driverId, {
        location: [longitude, latitude], // MongoDB format: [longitude, latitude]
        lastLocationAt: new Date()
      });

      return true;
    } catch (error) {
      this.logger.error(`Failed to update location for driver ${driverId}:`, error);
      return false;
    }
  }

  /**
   * Lấy danh sách đơn hàng gần driver
   */
  async getNearbyOrdersForDriver(
    driverId: string,
    radiusKm: number = 5
  ): Promise<OrderDocument[]> {
    try {
      const driver = await this.driverModel.findById(driverId).lean();
      if (!driver || !driver.location) {
        return [];
      }

      const [driverLon, driverLat] = driver.location;

      // Tìm đơn hàng status = ready và có restaurant coordinates
      const orders = await this.orderModel
        .find({
          status: OrderStatus.READY,
          driverId: { $exists: false },
          restaurantCoordinates: { $exists: true }
        })
        .lean();

      // Lọc theo khoảng cách
      const nearbyOrders = orders
        .map((order) => {
          if (!order.restaurantCoordinates) return null;
          
          const { latitude, longitude } = order.restaurantCoordinates;
          const distance = this.distanceService.calculateHaversine(
            driverLat,
            driverLon,
            latitude,
            longitude
          );

          return {
            order,
            distance
          };
        })
        .filter((item): item is { order: any; distance: number } => {
          return item !== null && item.distance <= radiusKm;
        })
        .sort((a, b) => a.distance - b.distance)
        .map((item) => item.order);

      return nearbyOrders as OrderDocument[];

    } catch (error) {
      this.logger.error(`Failed to get nearby orders for driver ${driverId}:`, error);
      return [];
    }
  }
}
