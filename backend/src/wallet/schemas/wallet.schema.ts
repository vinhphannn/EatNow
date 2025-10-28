import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WalletDocument = Wallet & Document;

/**
 * Wallet Schema - Hỗ trợ multi-actor wallet system
 * 
 * Actors: customer, restaurant, driver, admin (server/system wallet)
 * Mỗi actor có ví riêng để quản lý tiền nội bộ
 */
@Schema({ timestamps: true })
export class Wallet {
  // Actor reference - CHỈ CẦN 1 trong 4 trường này
  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId?: Types.ObjectId;  // Cho customer, admin hoặc internal transfers

  @Prop({ type: Types.ObjectId, ref: 'Restaurant' })
  restaurantId?: Types.ObjectId;  // Cho nhà hàng

  @Prop({ type: Types.ObjectId, ref: 'Driver' })
  driverId?: Types.ObjectId;  // Cho tài xế

  // System/Admin wallet (không link đến bất kỳ user nào)
  @Prop({ default: false })
  isSystemWallet?: boolean;  // true nếu là ví hệ thống (platform wallet)

  // Actor type - để dễ query
  @Prop({ required: true, enum: ['customer', 'restaurant', 'driver', 'admin'] })
  ownerType: string;  // Loại ví: customer, restaurant, driver, admin

  // Balance info
  @Prop({ required: true, default: 0 })
  balance: number;  // Số dư khả dụng

  @Prop({ required: true, default: 0 })
  pendingBalance: number;  // Số dư đang chờ (chờ MoMo callback confirm)

  // Số dư đang giữ (escrow) cho các đơn hàng đã thanh toán nhưng chưa hoàn tất
  @Prop({ required: true, default: 0 })
  escrowBalance: number;

  @Prop({ required: true, default: 0 })
  totalDeposits: number;  // Tổng đã nạp vào

  @Prop({ required: true, default: 0 })
  totalWithdrawals: number;  // Tổng đã rút ra

  @Prop({ required: true, default: true })
  isActive: boolean;  // Trạng thái ví (có thể khóa)

  @Prop({ type: Object })
  metadata?: any;  // Thông tin bổ sung
}

export const WalletSchema = SchemaFactory.createForClass(Wallet);

// Indexes để query nhanh
WalletSchema.index({ userId: 1, ownerType: 1 });
WalletSchema.index({ restaurantId: 1, ownerType: 1 });
WalletSchema.index({ driverId: 1, ownerType: 1 });
WalletSchema.index({ isSystemWallet: 1 });
WalletSchema.index({ ownerType: 1 });

// Unique indexes để tránh tạo trùng ví cho cùng actor
// Dùng partialFilterExpression để chỉ áp dụng khi field tồn tại
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

// Index thêm cho escrowBalance để truy vấn nhanh
WalletSchema.index({ escrowBalance: 1 });






















