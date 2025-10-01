import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PromotionDocument = HydratedDocument<Promotion>;

export enum PromotionType {
  PERCENTAGE = 'percentage',
  FIXED_AMOUNT = 'fixed_amount',
  FREE_DELIVERY = 'free_delivery',
  BUY_X_GET_Y = 'buy_x_get_y',
  MINIMUM_ORDER = 'minimum_order',
}

export enum PromotionStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

export enum PromotionTarget {
  ALL_USERS = 'all_users',
  NEW_USERS = 'new_users',
  EXISTING_USERS = 'existing_users',
  SPECIFIC_USERS = 'specific_users',
  RESTAURANT_CUSTOMERS = 'restaurant_customers',
}

@Schema({ timestamps: true })
export class Promotion {
  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ required: true })
  code: string; // Voucher code

  @Prop({ enum: PromotionType, required: true })
  type: PromotionType;

  @Prop({ enum: PromotionStatus, default: PromotionStatus.DRAFT })
  status: PromotionStatus;

  @Prop({ required: true })
  value: number; // Discount value (percentage or fixed amount)

  @Prop()
  maxDiscountAmount?: number; // For percentage discounts

  @Prop()
  minOrderAmount?: number; // Minimum order amount to apply

  @Prop()
  maxOrderAmount?: number; // Maximum order amount to apply

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ default: 1 })
  usageLimit: number; // Total usage limit

  @Prop({ default: 1 })
  usageLimitPerUser: number; // Usage limit per user

  @Prop({ default: 0 })
  usedCount: number; // Current usage count

  @Prop({ type: [Types.ObjectId], ref: 'User' })
  targetUsers?: Types.ObjectId[]; // For specific users

  @Prop({ type: [Types.ObjectId], ref: 'Restaurant' })
  applicableRestaurants?: Types.ObjectId[]; // Specific restaurants

  @Prop({ type: [Types.ObjectId], ref: 'Item' })
  applicableItems?: Types.ObjectId[]; // Specific items

  @Prop({ enum: PromotionTarget, default: PromotionTarget.ALL_USERS })
  target: PromotionTarget;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  imageUrl?: string;

  @Prop()
  termsAndConditions?: string;

  @Prop()
  createdBy?: Types.ObjectId; // Admin who created

  @Prop({ type: Object })
  metadata?: Record<string, any>;
}

export const PromotionSchema = SchemaFactory.createForClass(Promotion);

// Indexes for efficient queries
PromotionSchema.index({ code: 1 }, { unique: true });
PromotionSchema.index({ status: 1, isActive: 1 });
PromotionSchema.index({ startDate: 1, endDate: 1 });
PromotionSchema.index({ applicableRestaurants: 1 });
PromotionSchema.index({ targetUsers: 1 });
PromotionSchema.index({ createdAt: -1 });
