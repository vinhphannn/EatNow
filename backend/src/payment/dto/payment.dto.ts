import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

/**
 * Deposit Request DTO - Nạp tiền vào ví
 */
export class DepositDto {
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  amount: number;  // Số tiền nạp (VND)

  @IsEnum(['momo', 'zalopay', 'cash', 'bank_transfer'])
  provider: string;  // Phương thức thanh toán

  @IsOptional()
  @IsString()
  ownerType?: 'customer' | 'restaurant' | 'driver' | 'admin';  // Loại ví

  @IsOptional()
  @IsString()
  description?: string;  // Mô tả
}

/**
 * Withdraw Request DTO - Rút tiền từ ví
 */
export class WithdrawDto {
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  amount: number;  // Số tiền rút (VND)

  @IsEnum(['momo', 'zalopay', 'bank_transfer'])
  provider: string;  // Phương thức rút tiền

  @IsOptional()
  @IsString()
  phoneNumber?: string;  // Số điện thoại MoMo

  @IsOptional()
  @IsString()
  description?: string;  // Mô tả
}

/**
 * Order Payment Request DTO - Thanh toán đơn hàng
 */
export class OrderPaymentDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;  // ID đơn hàng

  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  amount: number;  // Tổng tiền (VND)

  @IsString()
  @IsNotEmpty()
  orderCode: string;  // Mã đơn hàng

  @IsString()
  @IsNotEmpty()
  restaurantId: string;  // ID nhà hàng
}

/**
 * Payment URL Response DTO
 */
export class PaymentUrlResponseDto {
  success: boolean;
  transactionId: string;
  paymentUrl?: string;
  redirectUrl?: string;
  message?: string;
}

/**
 * Payment Status Response DTO
 */
export class PaymentStatusResponseDto {
  transactionId: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  amount: number;
  provider?: string;
  metadata?: any;
}

