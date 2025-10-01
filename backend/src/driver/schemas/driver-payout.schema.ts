import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type DriverPayoutDocument = HydratedDocument<DriverPayout>;

export enum PayoutStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum PayoutMethod {
  BANK_TRANSFER = 'bank_transfer',
  MOMO = 'momo',
  VNPAY = 'vnpay',
  ZALOPAY = 'zalopay',
  CASH = 'cash',
}

@Schema({ timestamps: true })
export class DriverPayout {
  @Prop({ type: Types.ObjectId, ref: 'Driver', required: true })
  driverId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  processedBy?: Types.ObjectId; // Admin who processed

  @Prop({ required: true })
  amount: number; // Amount in VND

  @Prop({ required: true })
  currency: string; // 'VND'

  @Prop({ enum: PayoutMethod, required: true })
  method: PayoutMethod;

  @Prop({ enum: PayoutStatus, default: PayoutStatus.PENDING })
  status: PayoutStatus;

  @Prop()
  referenceCode?: string; // Our reference code

  @Prop()
  externalTransactionId?: string; // External payment provider ID

  @Prop()
  bankAccount?: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    branch?: string;
  };

  @Prop()
  eWalletAccount?: {
    provider: string; // momo, vnpay, zalopay
    phoneNumber: string;
    accountName: string;
  };

  @Prop()
  processedAt?: Date;

  @Prop()
  completedAt?: Date;

  @Prop()
  failureReason?: string;

  @Prop()
  failureCode?: string;

  @Prop()
  description?: string;

  // Related orders for this payout
  @Prop({ type: [Types.ObjectId], ref: 'Order' })
  orderIds?: Types.ObjectId[];

  @Prop({ default: 0 })
  orderCount: number; // Number of orders included

  // Earnings breakdown
  @Prop({ required: true })
  deliveryFees: number; // Total delivery fees earned

  @Prop({ default: 0 })
  tips: number; // Tips received

  @Prop({ default: 0 })
  bonuses: number; // Performance bonuses

  @Prop({ default: 0 })
  incentives: number; // Special incentives

  @Prop({ required: true })
  grossAmount: number; // Total earnings before deductions

  // Deductions
  @Prop({ default: 0 })
  platformFee: number; // Platform commission

  @Prop({ default: 0 })
  processingFee: number; // Payment processing fee

  @Prop({ default: 0 })
  insuranceFee: number; // Insurance fee

  @Prop({ default: 0 })
  otherDeductions: number; // Other deductions

  @Prop({ required: true })
  netAmount: number; // Final amount to driver

  // Settlement period
  @Prop({ required: true })
  settlementStartDate: Date;

  @Prop({ required: true })
  settlementEndDate: Date;

  // Performance metrics
  @Prop({ default: 0 })
  totalDistance: number; // Total distance in km

  @Prop({ default: 0 })
  totalDeliveryTime: number; // Total delivery time in minutes

  @Prop({ default: 0 })
  averageRating: number; // Average rating for the period

  @Prop({ default: 0 })
  onTimeDeliveries: number; // Number of on-time deliveries

  @Prop({ default: 0 })
  totalDeliveries: number; // Total deliveries in period

  @Prop()
  notes?: string;

  @Prop()
  metadata?: Record<string, any>;
}

export const DriverPayoutSchema = SchemaFactory.createForClass(DriverPayout);

// Indexes for efficient queries
DriverPayoutSchema.index({ driverId: 1, status: 1 });
DriverPayoutSchema.index({ status: 1, createdAt: -1 });
DriverPayoutSchema.index({ referenceCode: 1 });
DriverPayoutSchema.index({ externalTransactionId: 1 });
DriverPayoutSchema.index({ settlementStartDate: 1, settlementEndDate: 1 });
DriverPayoutSchema.index({ processedBy: 1 });
DriverPayoutSchema.index({ orderIds: 1 });
