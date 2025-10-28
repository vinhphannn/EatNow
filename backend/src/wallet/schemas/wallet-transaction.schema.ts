import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WalletTransactionDocument = WalletTransaction & Document;

/**
 * Wallet Transaction Schema - Giao dịch trong ví
 * 
 * LUỒNG ESCROW MỚI:
 * 1. order_payment: Customer trả → status='escrowed' → tiền vào escrowBalance platform
 * 2. order_revenue/commission/platform_fee: Order delivered → status='completed' → tiền từ escrow platform
 * 
 * TRANSACTION TYPES:
 * - deposit: Nạp tiền vào ví (MoMo/ZaloPay)
 * - withdraw: Rút tiền từ ví ra MoMo/ZaloPay
 * - order_payment: Customer thanh toán đơn hàng (escrow → platform)
 * - order_revenue: Restaurant nhận tiền từ đơn hàng (platform → restaurant)
 * - commission: Driver nhận tiền từ đơn hàng (platform → driver)
 * - platform_fee: Platform thu phí từ đơn hàng (platform giữ lại)
 * - refund: Hoàn tiền cho customer (platform → customer)
 * - transfer: Chuyển tiền nội bộ giữa các ví
 * - fee: Phí dịch vụ khác
 * 
 * STATUS:
 * - pending: Đang chờ xử lý (deposit/withdraw)
 * - completed: Hoàn thành thành công
 * - failed: Thất bại
 * - cancelled: Đã hủy
 * - escrowed: Đang giữ (order_payment chưa delivered)
 */
@Schema({ timestamps: true })
export class WalletTransaction {
  // ========== WALLET REFERENCE ==========
  
  @Prop({ required: true, type: Types.ObjectId, ref: 'Wallet' })
  walletId: Types.ObjectId;

  // ========== ACTOR REFERENCE (CHỈ CẦN 1 TRONG 4) ==========
  
  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId?: Types.ObjectId;  // Cho customer hoặc admin user

  @Prop({ type: Types.ObjectId, ref: 'Restaurant' })
  restaurantId?: Types.ObjectId;  // Cho nhà hàng

  @Prop({ type: Types.ObjectId, ref: 'Driver' })
  driverId?: Types.ObjectId;  // Cho tài xế

  @Prop({ default: false })
  isSystemTransaction?: boolean;  // true = giao dịch của platform/system

  // ========== TRANSACTION INFO ==========
  
  @Prop({ required: true, enum: [
    'deposit',        // Nạp tiền vào ví
    'withdraw',       // Rút tiền từ ví
    'order_payment',  // Customer thanh toán đơn hàng
    'order_revenue',  // Restaurant nhận tiền từ đơn hàng
    'commission',     // Driver nhận tiền từ đơn hàng
    'platform_fee',   // Platform thu phí từ đơn hàng
    'refund',         // Hoàn tiền cho customer
    'transfer',       // Chuyển tiền nội bộ
    'fee'            // Phí dịch vụ khác
  ]})
  type: string;

  @Prop({ required: true })
  amount: number;  // Số tiền (âm = chi, dương = thu)

  @Prop()
  description: string;  // Mô tả giao dịch

  @Prop({ required: true, enum: ['pending', 'completed', 'failed', 'cancelled', 'escrowed'], default: 'pending' })
  status: string;

  // ========== PAYMENT PROVIDER FIELDS ==========
  
  @Prop()
  provider?: string;  // 'momo', 'zalopay', 'cash', 'bank_transfer'

  @Prop()
  providerTransactionId?: string;  // Transaction ID từ MoMo/ZaloPay

  @Prop()
  providerPaymentUrl?: string;  // URL thanh toán (redirect user)

  @Prop({ type: Object })
  providerCallback?: any;  // Raw callback data từ provider

  // ========== ORDER REFERENCE ==========
  
  @Prop({ type: Types.ObjectId, ref: 'Order' })
  orderId?: Types.ObjectId;  // Link đến đơn hàng (nếu có)

  @Prop()
  orderCode?: string;  // Mã đơn hàng (để hiển thị)

  // ========== METADATA ==========
  
  @Prop({ type: Object })
  metadata?: any;  // Thông tin bổ sung (settings, config, etc.)

  // ========== TIMESTAMPS (AUTO-GENERATED) ==========
  
  createdAt?: Date;
  updatedAt?: Date;
}

export const WalletTransactionSchema = SchemaFactory.createForClass(WalletTransaction);

// ========== PERFORMANCE INDEXES ==========
// Query nhanh theo wallet và thời gian
WalletTransactionSchema.index({ walletId: 1, createdAt: -1 });

// Query theo actor và status
WalletTransactionSchema.index({ userId: 1, status: 1 });
WalletTransactionSchema.index({ restaurantId: 1, status: 1 });
WalletTransactionSchema.index({ driverId: 1, status: 1 });

// Query theo order
WalletTransactionSchema.index({ orderId: 1 });
WalletTransactionSchema.index({ orderCode: 1 });

// Query theo provider
WalletTransactionSchema.index({ providerTransactionId: 1 });

// Query theo type và status
WalletTransactionSchema.index({ type: 1, status: 1 });

// ========== UNIQUE CONSTRAINTS (IDEMPOTENCY) ==========
// Tránh duplicate transactions
WalletTransactionSchema.index(
  { providerTransactionId: 1 },
  { unique: true, sparse: true }
);

// Tránh trừ tiền 2 lần cho cùng 1 đơn hàng
WalletTransactionSchema.index(
  { type: 1, orderId: 1, status: 1 },
  { 
    unique: true, 
    sparse: true, 
    partialFilterExpression: { 
      type: 'order_payment', 
      orderId: { $exists: true },
      status: 'completed'
    } 
  }
);