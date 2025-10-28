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
 * Wallet Response DTO - Thông tin ví
 */
export class WalletResponseDto {
  balance: number;
  pendingBalance: number;
  totalDeposits: number;
  totalWithdrawals: number;
  isActive: boolean;
}

/**
 * Transaction Response DTO - Thông tin giao dịch
 */
export class TransactionResponseDto {
  id: string;
  type: string;
  amount: number;
  description: string;
  status: string;
  provider?: string;
  createdAt: Date;
  metadata?: any;
}

/**
 * Payment URL Response DTO - Response khi tạo payment URL
 */
export class PaymentUrlResponseDto {
  requestId: string;
  orderId: string;
  payUrl: string;
}

