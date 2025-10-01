import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from '../schemas/order.schema';
import { Driver, DriverDocument } from '../../driver/schemas/driver.schema';
import { DriverPerformanceService } from '../../driver/services/driver-performance.service';
import { DistanceService } from '../../common/services/distance.service';

@Injectable()
export class OrderAssignmentService {
  private readonly logger = new Logger(OrderAssignmentService.name);

  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Driver.name) private driverModel: Model<DriverDocument>,
    private driverPerformanceService: DriverPerformanceService,
    private distanceService: DistanceService,
  ) {}

  /**
   * Assign order to the best available driver
   */
  async assignOrderToDriver(orderId: string): Promise<boolean> {
    try {
      const order = await this.orderModel.findById(orderId);
      if (!order) {
        this.logger.error(`Order ${orderId} not found`);
        return false;
      }

      // Get restaurant location (assuming it's stored in restaurant)
      // For now, we'll use a mock restaurant location
      const restaurantLat = 10.7769; // Mock coordinates
      const restaurantLon = 106.7009;

      // Find available drivers within 2km
      const availableDrivers = await this.driverPerformanceService.getAvailableDriversInRange(
        restaurantLat,
        restaurantLon,
        2 // 2km radius
      );

      if (availableDrivers.length === 0) {
        this.logger.warn(`No available drivers found for order ${orderId}`);
        return false;
      }

      // Sort by performance score (highest first), then by distance
      const sortedDrivers = availableDrivers.sort((a, b) => {
        // First by performance score
        if (b.performanceScore !== a.performanceScore) {
          return b.performanceScore - a.performanceScore;
        }
        
        // If same performance score, sort by distance
        const distanceA = this.calculateDistanceToRestaurant(a, restaurantLat, restaurantLon);
        const distanceB = this.calculateDistanceToRestaurant(b, restaurantLat, restaurantLon);
        return distanceA - distanceB;
      });

      const selectedDriver = sortedDrivers[0];
      
      // Calculate distances
      const distanceToRestaurant = this.calculateDistanceToRestaurant(
        selectedDriver,
        restaurantLat,
        restaurantLon
      );
      
      const distanceToCustomer = this.calculateDistanceToCustomer(
        selectedDriver,
        order.deliveryAddress.latitude,
        order.deliveryAddress.longitude
      );

      // Update order with driver assignment
      await this.orderModel.findByIdAndUpdate(orderId, {
        driverId: selectedDriver._id,
        assignedAt: new Date(),
        distanceToRestaurant,
        distanceToCustomer,
        driverRating: selectedDriver.performanceScore,
        status: 'confirmed'
      });

      // Update driver status
      await this.driverModel.findByIdAndUpdate(selectedDriver._id, {
        currentOrderId: orderId,
        isAvailable: false
      });

      this.logger.log(`Order ${orderId} assigned to driver ${selectedDriver._id} (score: ${selectedDriver.performanceScore})`);
      return true;

    } catch (error) {
      this.logger.error(`Failed to assign order ${orderId}:`, error);
      return false;
    }
  }

  /**
   * Calculate distance from driver to restaurant
   */
  private calculateDistanceToRestaurant(
    driver: DriverDocument,
    restaurantLat: number,
    restaurantLon: number
  ): number {
    if (!driver.location) return Infinity;
    
    return this.distanceService.calculateDistance(
      driver.location[1], // lat
      driver.location[0], // lng
      restaurantLat,
      restaurantLon
    );
  }

  /**
   * Calculate distance from driver to customer
   */
  private calculateDistanceToCustomer(
    driver: DriverDocument,
    customerLat: number,
    customerLon: number
  ): number {
    if (!driver.location) return Infinity;
    
    return this.distanceService.calculateDistance(
      driver.location[1], // lat
      driver.location[0], // lng
      customerLat,
      customerLon
    );
  }

  /**
   * Process pending orders and assign drivers
   */
  async processPendingOrders(): Promise<void> {
    try {
      const pendingOrders = await this.orderModel.find({
        status: 'pending',
        driverId: { $exists: false }
      });

      for (const order of pendingOrders) {
        const assigned = await this.assignOrderToDriver(order._id.toString());
        if (assigned) {
          this.logger.log(`Successfully assigned order ${order._id}`);
        } else {
          this.logger.warn(`Failed to assign order ${order._id}`);
        }
      }
    } catch (error) {
      this.logger.error('Error processing pending orders:', error);
    }
  }

  /**
   * Reject order assignment (driver rejects the order)
   */
  async rejectOrderAssignment(driverId: string, orderId: string): Promise<void> {
    try {
      // Update driver performance
      await this.driverPerformanceService.updatePerformanceMetrics(driverId, {
        orderRejected: true
      });

      // Remove driver from order
      await this.orderModel.findByIdAndUpdate(orderId, {
        $unset: { driverId: 1, assignedAt: 1, driverRating: 1 }
      });

      // Mark driver as available again
      await this.driverModel.findByIdAndUpdate(driverId, {
        isAvailable: true,
        $unset: { currentOrderId: 1 }
      });

      this.logger.log(`Driver ${driverId} rejected order ${orderId}`);
    } catch (error) {
      this.logger.error(`Failed to reject order assignment:`, error);
    }
  }

  /**
   * Complete order delivery
   */
  async completeOrderDelivery(driverId: string, orderId: string): Promise<void> {
    try {
      const order = await this.orderModel.findById(orderId);
      if (!order) return;

      // Calculate delivery time
      const deliveryTime = order.assignedAt 
        ? (new Date().getTime() - order.assignedAt.getTime()) / (1000 * 60) // in minutes
        : 0;

      // Update driver performance
      await this.driverPerformanceService.updatePerformanceMetrics(driverId, {
        orderCompleted: true,
        deliveryTime,
        wasOnTime: deliveryTime <= 30 // Consider on-time if delivered within 30 minutes
      });

      // Update order status
      await this.orderModel.findByIdAndUpdate(orderId, {
        status: 'delivered',
        actualDeliveryTime: new Date()
      });

      // Mark driver as available
      await this.driverModel.findByIdAndUpdate(driverId, {
        isAvailable: true,
        $unset: { currentOrderId: 1 }
      });

      this.logger.log(`Driver ${driverId} completed order ${orderId} in ${deliveryTime} minutes`);
    } catch (error) {
      this.logger.error(`Failed to complete order delivery:`, error);
    }
  }
}
