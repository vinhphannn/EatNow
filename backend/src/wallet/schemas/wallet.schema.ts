import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WalletDocument = Wallet & Document;

/**
 * Wallet Schema - Multi-actor wallet system
 * 
 * LUỒNG ESCROW MỚI:
 * 1. Customer đặt đơn → tiền từ balance → escrowBalance của platform
 * 2. Order delivered → tiền từ escrowBalance platform → chia cho restaurant + driver + platform fee
 * 
 * ACTORS:
 * - customer: Ví khách hàng (userId)
 * - restaurant: Ví nhà hàng (restaurantId) 
 * - driver: Ví tài xế (driverId)
 * - admin: Ví platform/system (isSystemWallet = true)
 * 
 * BALANCE FIELDS:
 * - balance: Số dư khả dụng (có thể rút/nạp)
 * - pendingBalance: Tiền đang chờ xác nhận từ MoMo/ZaloPay
 * - escrowBalance: Tiền đang giữ cho orders (chỉ platform wallet dùng)
 * - totalDeposits/totalWithdrawals: Thống kê tổng
 */
@Schema({ timestamps: true })
export class Wallet {
  // ========== ACTOR REFERENCE (CHỈ CẦN 1 TRONG 4) ==========
  
  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId?: Types.ObjectId;  // Cho customer hoặc admin user

  @Prop({ type: Types.ObjectId, ref: 'Restaurant' })
  restaurantId?: Types.ObjectId;  // Cho nhà hàng

  @Prop({ type: Types.ObjectId, ref: 'Driver' })
  driverId?: Types.ObjectId;  // Cho tài xế

  @Prop({ default: false })
  isSystemWallet?: boolean;  // true = ví platform/system (không link user nào)

  // ========== WALLET TYPE & STATUS ==========
  
  @Prop({ required: true, enum: ['customer', 'restaurant', 'driver', 'admin'] })
  ownerType: string;  // Loại ví để phân biệt actor

  @Prop({ required: true, default: true })
  isActive: boolean;  // Trạng thái ví (có thể khóa/deactivate)

  // ========== BALANCE FIELDS ==========
  
  @Prop({ required: true, default: 0 })
  balance: number;  // Số dư khả dụng (có thể rút/nạp)

  @Prop({ required: true, default: 0 })
  pendingBalance: number;  // Tiền đang chờ xác nhận từ payment provider

  @Prop({ required: true, default: 0 })
  escrowBalance: number;  // Tiền đang giữ cho orders (chỉ platform wallet dùng)

  // ========== STATISTICS ==========
  
  @Prop({ required: true, default: 0 })
  totalDeposits: number;  // Tổng đã nạp vào (lịch sử)

  @Prop({ required: true, default: 0 })
  totalWithdrawals: number;  // Tổng đã rút ra (lịch sử)

  // ========== METADATA ==========
  
  @Prop({ type: Object })
  metadata?: any;  // Thông tin bổ sung (settings, config, etc.)
}

export const WalletSchema = SchemaFactory.createForClass(Wallet);

// ========== PERFORMANCE INDEXES ==========
// Query nhanh theo actor
WalletSchema.index({ userId: 1, ownerType: 1 });
WalletSchema.index({ restaurantId: 1, ownerType: 1 });
WalletSchema.index({ driverId: 1, ownerType: 1 });
WalletSchema.index({ isSystemWallet: 1 });
WalletSchema.index({ ownerType: 1 });

// Query escrow balance (platform wallet)
WalletSchema.index({ escrowBalance: 1 });

// ========== UNIQUE CONSTRAINTS ==========
// Tránh tạo trùng ví cho cùng actor
WalletSchema.index(
  { ownerType: 1, userId: 1 },
  { unique: true, sparse: true, partialFilterExpression: { userId: { $exists: true } } }
);
WalletSchema.index(
  { ownerType: 1, restaurantId: 1 },
  { unique: true, sparse: true, partialFilterExpression: { restaurantId: { $exists: true } } }
);
WalletSchema.index(
  { ownerType: 1, driverId: 1 },
  { unique: true, sparse: true, partialFilterExpression: { driverId: { $exists: true } } }
);
// Chỉ có 1 system wallet
WalletSchema.index(
  { isSystemWallet: 1 },
  { unique: true, sparse: true, partialFilterExpression: { isSystemWallet: true } }
);






















