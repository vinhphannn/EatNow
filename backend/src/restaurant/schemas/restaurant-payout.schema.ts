import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type RestaurantPayoutDocument = HydratedDocument<RestaurantPayout>;

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
export class RestaurantPayout {
  @Prop({ type: Types.ObjectId, ref: 'Restaurant', required: true })
  restaurantId: Types.ObjectId;

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

  // Commission and fees
  @Prop({ required: true })
  grossAmount: number; // Total amount before fees

  @Prop({ required: true })
  commissionRate: number; // Commission rate (e.g., 0.15 for 15%)

  @Prop({ required: true })
  commissionAmount: number; // Commission deducted

  @Prop({ default: 0 })
  platformFee: number; // Platform fee

  @Prop({ default: 0 })
  processingFee: number; // Payment processing fee

  @Prop({ default: 0 })
  otherFees: number; // Other fees

  @Prop({ required: true })
  netAmount: number; // Final amount to restaurant

  // Settlement period
  @Prop({ required: true })
  settlementStartDate: Date;

  @Prop({ required: true })
  settlementEndDate: Date;

  @Prop()
  notes?: string;

  @Prop()
  metadata?: Record<string, any>;
}

export const RestaurantPayoutSchema = SchemaFactory.createForClass(RestaurantPayout);

// Indexes for efficient queries
RestaurantPayoutSchema.index({ restaurantId: 1, status: 1 });
RestaurantPayoutSchema.index({ status: 1, createdAt: -1 });
RestaurantPayoutSchema.index({ referenceCode: 1 });
RestaurantPayoutSchema.index({ externalTransactionId: 1 });
RestaurantPayoutSchema.index({ settlementStartDate: 1, settlementEndDate: 1 });
RestaurantPayoutSchema.index({ processedBy: 1 });
RestaurantPayoutSchema.index({ orderIds: 1 });
