import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PaymentDocument = HydratedDocument<Payment>;

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCESS = 'success',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
}

export enum PaymentMethod {
  CASH = 'cash',
  BANK_TRANSFER = 'bank_transfer',
  MOMO = 'momo',
  VNPAY = 'vnpay',
  ZALOPAY = 'zalopay',
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
}

export enum PaymentProvider {
  VNPAY = 'vnpay',
  MOMO = 'momo',
  ZALOPAY = 'zalopay',
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
  MANUAL = 'manual', // For cash payments
}

@Schema({ timestamps: true })
export class Payment {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Order', required: true })
  orderId: Types.ObjectId;

  @Prop({ required: true })
  amount: number; // Amount in VND

  @Prop({ required: true })
  currency: string; // 'VND', 'USD', etc.

  @Prop({ enum: PaymentMethod, required: true })
  method: PaymentMethod;

  @Prop({ enum: PaymentProvider, required: true })
  provider: PaymentProvider;

  @Prop({ enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Prop()
  transactionId?: string; // Provider's transaction ID

  @Prop()
  referenceCode?: string; // Our reference code

  @Prop({ type: Object })
  gatewayResponse?: Record<string, any>; // Raw response from payment gateway

  @Prop()
  failureReason?: string;

  @Prop()
  paidAt?: Date;

  @Prop()
  refundedAt?: Date;

  @Prop()
  refundAmount?: number;

  @Prop()
  refundReason?: string;

  @Prop()
  refundTransactionId?: string;

  @Prop()
  description?: string;

  @Prop({ type: Object })
  metadata?: Record<string, any>; // Additional data

  @Prop({ type: Object })
  webhookData?: Record<string, any>; // Webhook payload from provider

  @Prop()
  expiresAt?: Date; // For pending payments
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);

// Indexes for efficient queries
PaymentSchema.index({ userId: 1, status: 1 });
PaymentSchema.index({ orderId: 1 });
PaymentSchema.index({ transactionId: 1 });
PaymentSchema.index({ referenceCode: 1 });
PaymentSchema.index({ status: 1, createdAt: -1 });
PaymentSchema.index({ provider: 1, status: 1 });
PaymentSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
