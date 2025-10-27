/**
 * Pricing Service - Tính toán tiền bảo mật ở backend
 * 
 * Chức năng:
 * - Tính toán tất cả các loại phí và chiết khấu
 * - Đảm bảo tính toán chính xác và bảo mật
 * - Hỗ trợ các trường mới trong Order schema
 */

import { Injectable, Logger } from '@nestjs/common';
import { DistanceService } from '../../common/services/distance.service';

export interface PricingConfig {
  // Phí platform
  platformFeeRate: number; // % phí platform
  
  // Phí cố định
  doorFeeAmount: number; // Phí giao tận cửa
  
  // Chiết khấu tài xế
  driverCommissionRate: number; // % chiết khấu tài xế (thu từ phí giao hàng)
}

export interface OrderPricingInput {
  subtotal: number; // Tiền món ăn
  deliveryFee: number; // Phí giao hàng
  tip: number; // Thưởng tài xế
  doorFee: boolean; // Có giao tận cửa không
}

export interface OrderPricingResult {
  // Các trường cơ bản
  subtotal: number;
  deliveryFee: number;
  tip: number;
  doorFee: number;
  finalTotal: number;
  
  // Các trường mới
  customerPayment: number; // Tiền khách trả
  restaurantRevenue: number; // Tiền quán nhận (sau khi trừ phí platform)
  driverPayment: number; // Tiền tài xế nhận (sau khi trừ chiết khấu 30%)
  
  // Phí platform
  platformFeeRate: number;
  platformFeeAmount: number;
  
  // Chiết khấu tài xế
  driverCommissionRate: number; // Tỷ lệ chiết khấu tài xế
  driverCommissionAmount: number; // Số tiền chiết khấu tài xế
}

@Injectable()
export class PricingService {
  private readonly logger = new Logger(PricingService.name);
  
  constructor(
    private readonly distanceService: DistanceService
  ) {}
  
  // Cấu hình mặc định
  private readonly defaultConfig: PricingConfig = {
    platformFeeRate: 10, // Platform thu 10% từ quán
    doorFeeAmount: 5000, // 5k phí giao tận cửa
    driverCommissionRate: 30, // Platform thu 30% từ phí giao hàng
  };

  /**
   * Tính toán giá cả cho đơn hàng
   * 
   * CÔNG THỨC TÍNH TIỀN:
   * ============================================================
   * 1. Tiền khách trả (customerPayment):
   *    = subtotal + deliveryFee + tip + doorFee
   * 
   * 2. Tiền quán nhận (restaurantRevenue):
   *    = subtotal - platformFee
   * 
   * 3. Tiền tài xế nhận (driverPayment):
   *    = (deliveryFee - commission) + tip + doorFee
   * 
   * 4. Tiền platform thu:
   *    = platformFee (từ quán) + commission (từ tài xế)
   * 
   * KIỂM TRA:
   * customerPayment = restaurantRevenue + driverPayment + platformFee + commission
   * 
   * VÍ DỤ (150k subtotal, 20k delivery, 10k tip, 5k door):
   * - Khách trả: 150k + 20k + 10k + 5k = 185k
   * - Quán nhận: 150k - 15k = 135k
   * - Tài xế nhận: (20k - 6k) + 10k + 5k = 29k
   * - Platform thu: 15k (từ quán) + 6k (từ tài xế) = 21k
   * - Tổng: 135k + 29k + 21k = 185k ✅
   * ============================================================
   */
  calculateOrderPricing(input: OrderPricingInput, config?: Partial<PricingConfig>): OrderPricingResult {
    const finalConfig = { ...this.defaultConfig, ...config };
    
    this.logger.log('🔍 Calculating order pricing:', { input, config: finalConfig });
    
    // Tính phí platform (chỉ từ tiền món ăn)
    const platformFeeAmount = this.calculateDiscountAmount(input.subtotal, finalConfig.platformFeeRate);
    
    // Tính chiết khấu tài xế (30% từ phí giao hàng)
    const driverCommissionRate = finalConfig.driverCommissionRate;
    const driverCommissionAmount = this.calculateDiscountAmount(input.deliveryFee, driverCommissionRate);
    
    // Tính phí giao tận cửa
    const doorFeeAmount = input.doorFee ? finalConfig.doorFeeAmount : 0;
    
    // Tính finalTotal (tiền khách phải trả)
    const finalTotal = input.subtotal + input.deliveryFee + input.tip + doorFeeAmount;
    
    // Tính tiền quán nhận được (sau khi trừ phí platform)
    const restaurantRevenue = input.subtotal - platformFeeAmount;
    
    // Tính tiền tài xế nhận được
    // = (phí giao hàng - chiết khấu 30%) + tip + doorFee
    const driverPayment = input.deliveryFee + input.tip + doorFeeAmount - driverCommissionAmount;
    
    const result: OrderPricingResult = {
      // Các trường cơ bản
      subtotal: input.subtotal,
      deliveryFee: input.deliveryFee,
      tip: input.tip,
      doorFee: doorFeeAmount,
      finalTotal,
      
      // Các trường mới
      customerPayment: finalTotal,
      restaurantRevenue,
      driverPayment,
      
      // Phí platform
      platformFeeRate: finalConfig.platformFeeRate,
      platformFeeAmount,
      
      // Chiết khấu tài xế
      driverCommissionRate,
      driverCommissionAmount,
    };
    
    this.logger.log('🔍 Pricing calculation result:', result);
    
    // Validate kết quả
    this.validatePricingResult(result);
    
    return result;
  }

  /**
   * Tính số tiền chiết khấu từ tỷ lệ phần trăm
   */
  private calculateDiscountAmount(amount: number, rate: number): number {
    if (rate <= 0) return 0;
    return Math.round(amount * (rate / 100));
  }

  /**
   * Validate kết quả tính toán
   */
  private validatePricingResult(result: OrderPricingResult): void {
    // Kiểm tra các giá trị không âm
    if (result.customerPayment < 0) {
      throw new Error('Customer payment cannot be negative');
    }
    
    if (result.restaurantRevenue < 0) {
      throw new Error('Restaurant revenue cannot be negative');
    }
    
    if (result.driverPayment < 0) {
      throw new Error('Driver payment cannot be negative');
    }
    
    if (result.platformFeeAmount < 0) {
      throw new Error('Platform fee cannot be negative');
    }
    
    if (result.driverCommissionAmount < 0) {
      throw new Error('Driver commission cannot be negative');
    }
    
    // Kiểm tra logic tính toán - Final Total
    const expectedFinalTotal = result.subtotal + result.deliveryFee + result.tip + result.doorFee;
    if (Math.abs(result.finalTotal - expectedFinalTotal) > 1) { // Cho phép sai số 1đ do làm tròn
      throw new Error(`Final total calculation error: expected ${expectedFinalTotal}, got ${result.finalTotal}`);
    }
    
    // Kiểm tra customerPayment phải bằng finalTotal
    if (Math.abs(result.customerPayment - result.finalTotal) > 1) {
      throw new Error(`Customer payment mismatch: expected ${result.finalTotal}, got ${result.customerPayment}`);
    }
    
    // Kiểm tra restaurant revenue
    const expectedRestaurantRevenue = result.subtotal - result.platformFeeAmount;
    if (Math.abs(result.restaurantRevenue - expectedRestaurantRevenue) > 1) {
      throw new Error(`Restaurant revenue calculation error: expected ${expectedRestaurantRevenue}, got ${result.restaurantRevenue}`);
    }
    
    // Kiểm tra driver payment
    const expectedDriverPayment = result.deliveryFee + result.tip + result.doorFee - result.driverCommissionAmount;
    if (Math.abs(result.driverPayment - expectedDriverPayment) > 1) {
      throw new Error(`Driver payment calculation error: expected ${expectedDriverPayment}, got ${result.driverPayment}`);
    }
    
    // ⚠️ KIỂM TRA QUAN TRỌNG NHẤT: TỔNG TIỀN THU PHẢI BẰNG TỔNG TIỀN CHI
    // Tiền thu từ khách: customerPayment
    // Tiền trả cho quán: restaurantRevenue (sau khi trừ platform fee)
    // Tiền trả cho tài xế: driverPayment (sau khi trừ commission)
    // Platform thu được: platformFeeAmount (từ quán) + driverCommissionAmount (từ tài xế)
    
    // Công thức đúng:
    // customerPayment = restaurantRevenue + driverPayment + platformFeeAmount + driverCommissionAmount
    // (Platform tiền đã bị trừ khỏi restaurantRevenue và driverPayment rồi)
    
    const totalRevenue = result.customerPayment;
    const totalDistributed = result.restaurantRevenue + result.driverPayment;
    const totalPlatformRevenue = result.platformFeeAmount + result.driverCommissionAmount;
    
    // Kiểm tra: Tiền khách trả = Tiền trả + Tiền platform thu
    const expectedDistribution = result.restaurantRevenue + result.driverPayment + result.platformFeeAmount + result.driverCommissionAmount;
    
    if (Math.abs(totalRevenue - expectedDistribution) > 1) {
      throw new Error(
        `💰 MONEY BALANCE ERROR: Tiền thu ${totalRevenue} ≠ Tiền phân bổ ${expectedDistribution}\n` +
        `   - Customer pays: ${result.customerPayment}\n` +
        `   - Restaurant receives: ${result.restaurantRevenue} (đã trừ ${result.platformFeeAmount})\n` +
        `   - Driver receives: ${result.driverPayment} (đã trừ ${result.driverCommissionAmount})\n` +
        `   - Platform collects: ${result.platformFeeAmount} (từ quán) + ${result.driverCommissionAmount} (từ tài xế) = ${totalPlatformRevenue}\n` +
        `   - Difference: ${Math.abs(totalRevenue - expectedDistribution)}đ`
      );
    }
    
    this.logger.log(`✅ Money balance verified: Customer pays ${totalRevenue}đ\n` +
      `   → Restaurant: ${result.restaurantRevenue}đ + Platform fee: ${result.platformFeeAmount}đ\n` +
      `   → Driver: ${result.driverPayment}đ + Commission: ${result.driverCommissionAmount}đ\n` +
      `   → Total platform revenue: ${totalPlatformRevenue}đ`
    );
  }

  /**
   * Tính phí giao hàng dựa trên khoảng cách
   */
  calculateDeliveryFee(distanceKm: number): number {
    return this.distanceService.calculateDeliveryFee(distanceKm);
  }

  /**
   * Tính thời gian giao hàng dự kiến (trả về số phút)
   */
  calculateEstimatedDeliveryTime(distanceKm: number): number {
    return this.distanceService.calculateEstimatedDeliveryTime(distanceKm);
  }

}
