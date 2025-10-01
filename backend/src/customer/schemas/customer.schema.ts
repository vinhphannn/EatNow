import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CustomerDocument = HydratedDocument<Customer>;

@Schema({ timestamps: true })
export class Customer {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: Types.ObjectId;

  // Personal Information
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  fullName?: string;

  @Prop({ trim: true })
  phone?: string;

  @Prop({ type: String })
  avatarUrl?: string;

  @Prop({ type: Types.ObjectId, ref: 'Image' })
  avatarId?: Types.ObjectId;

  @Prop({ type: Date })
  dateOfBirth?: Date;

  @Prop({ enum: ['male', 'female', 'other'] })
  gender?: string;

  @Prop({ type: String, trim: true })
  bio?: string;

  // Address Management
  @Prop({
    type: [
      {
        label: { type: String, required: true },
        addressLine: { type: String, required: true },
        latitude: { type: Number, required: true },
        longitude: { type: Number, required: true },
        note: { type: String },
        isDefault: { type: Boolean, default: false },
        city: { type: String },
        district: { type: String },
        ward: { type: String },
        phone: { type: String },
        recipientName: { type: String },
        isActive: { type: Boolean, default: true },
      },
    ],
    default: [],
  })
  addresses?: Array<{
    label: string;
    addressLine: string;
    latitude: number;
    longitude: number;
    note?: string;
    isDefault?: boolean;
    city?: string;
    district?: string;
    ward?: string;
    phone?: string;
    recipientName?: string;
    isActive?: boolean;
  }>;

  @Prop({
    type: [String],
    default: ['Nhà', 'Chỗ làm', 'Nhà bạn', 'Khác'],
  })
  addressLabels?: string[];

  // Account Status
  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isPhoneVerified: boolean;

  @Prop({ type: Date })
  phoneVerifiedAt?: Date;

  @Prop({ type: Date })
  lastLoginAt?: Date;

  @Prop({ type: Date })
  lastActiveAt?: Date;

  // Preferences and Settings
  @Prop({ default: 'vi' })
  language: string;

  @Prop({ default: 'VN' })
  country: string;

  @Prop({ type: String })
  timezone?: string;

  @Prop({ default: 'vietnam_dong' })
  currency: string;

  @Prop({ default: true })
  allowPushNotifications: boolean;

  @Prop({ default: true })
  allowEmailNotifications: boolean;

  @Prop({ default: false })
  allowSMSNotifications: boolean;

  @Prop({ default: true })
  allowMarketingEmails: boolean;

  @Prop({ default: true })
  allowLocationTracking: boolean;

  // Food Preferences
  @Prop({ type: [String], default: [] })
  favoriteCuisines?: string[];

  @Prop({ type: [String], default: [] })
  dietaryRestrictions?: string[];

  @Prop({ type: [String], default: [] })
  allergens?: string[];

  @Prop({ default: 0 })
  spiceLevel: number; // 0-5

  // Order Statistics
  @Prop({ default: 0 })
  totalOrders: number;

  @Prop({ default: 0 })
  totalSpent: number;

  @Prop({ default: 0 })
  totalReviews: number;

  @Prop({ default: 0 })
  averageOrderValue: number;

  @Prop({ default: 0 })
  loyaltyPoints: number;

  @Prop({ default: 'bronze' })
  loyaltyTier: string; // bronze, silver, gold, platinum

  // Referral System
  @Prop({ type: Types.ObjectId, ref: 'Customer' })
  referredBy?: Types.ObjectId;

  @Prop({ default: 0 })
  referralCount: number;

  @Prop({ default: 0 })
  referralEarnings: number;

  // Security
  @Prop({ default: 0 })
  failedLoginAttempts: number;

  @Prop({ type: Date })
  lockedUntil?: Date;

  @Prop({ type: Date })
  passwordChangedAt?: Date;

  @Prop({ type: [String], default: [] })
  passwordHistory?: string[];

  // Device Management
  @Prop({ type: [String], default: [] })
  deviceTokens?: string[]; // For push notifications

  @Prop({ type: Object })
  lastDeviceInfo?: {
    userAgent?: string;
    platform?: string;
    version?: string;
    model?: string;
  };

  // Privacy and Data
  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ type: Date })
  deletedAt?: Date;

  @Prop({ type: Date })
  dataRetentionUntil?: Date;

  // Customer Specific Fields
  @Prop({ type: Object })
  preferences?: {
    favoriteRestaurants?: Types.ObjectId[];
    favoriteItems?: Types.ObjectId[];
    preferredDeliveryTime?: string;
    preferredPaymentMethod?: string;
    deliveryInstructions?: string;
  };

  @Prop({ type: Object })
  socialInfo?: {
    facebookId?: string;
    googleId?: string;
    appleId?: string;
    linkedInId?: string;
  };

  @Prop({ type: Object })
  subscriptionInfo?: {
    isSubscribed?: boolean;
    subscriptionType?: string;
    subscriptionStartDate?: Date;
    subscriptionEndDate?: Date;
    autoRenew?: boolean;
  };

  // Analytics and Tracking
  @Prop({ type: Object })
  analytics?: {
    lastOrderDate?: Date;
    favoriteOrderTime?: string;
    averageOrderFrequency?: number; // days between orders
    totalDeliveryFees?: number;
    totalServiceFees?: number;
    totalDiscounts?: number;
    cancellationRate?: number;
  };

  @Prop({ type: [Object] })
  orderHistory?: Array<{
    orderId: Types.ObjectId;
    restaurantId: Types.ObjectId;
    totalAmount: number;
    orderDate: Date;
    status: string;
    rating?: number;
  }>;

  @Prop({ type: [Object] })
  favoriteRestaurants?: Array<{
    restaurantId: Types.ObjectId;
    addedAt: Date;
    orderCount: number;
    lastOrderDate?: Date;
  }>;

  @Prop({ type: [Object] })
  favoriteItems?: Array<{
    itemId: Types.ObjectId;
    restaurantId: Types.ObjectId;
    addedAt: Date;
    orderCount: number;
    lastOrderDate?: Date;
  }>;
}

export const CustomerSchema = SchemaFactory.createForClass(Customer);

// Indexes for efficient queries
CustomerSchema.index({ userId: 1 }, { unique: true });
CustomerSchema.index({ phone: 1 }, { sparse: true });
CustomerSchema.index({ isActive: 1 });
CustomerSchema.index({ isPhoneVerified: 1 });
CustomerSchema.index({ lastLoginAt: -1 });
CustomerSchema.index({ createdAt: -1 });
CustomerSchema.index({ loyaltyTier: 1, loyaltyPoints: -1 });
CustomerSchema.index({ totalOrders: -1 });
CustomerSchema.index({ totalSpent: -1 });
CustomerSchema.index({ referredBy: 1 });
CustomerSchema.index({ isDeleted: 1, deletedAt: 1 });
CustomerSchema.index({ 'addresses.latitude': 1, 'addresses.longitude': 1 }); // Geospatial index
CustomerSchema.index({ 'preferences.favoriteRestaurants': 1 });
CustomerSchema.index({ 'preferences.favoriteItems': 1 });






