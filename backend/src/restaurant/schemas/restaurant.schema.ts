import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type RestaurantDocument = HydratedDocument<Restaurant>;

@Schema({ timestamps: true })
export class Restaurant {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  ownerUserId: any;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ trim: true })
  address?: string;

  @Prop()
  imageUrl?: string;

  @Prop({ type: Types.ObjectId, ref: 'Image' })
  imageId?: any;

  // Business info
  @Prop({ trim: true })
  businessLicense?: string;

  @Prop({ trim: true })
  taxCode?: string;

  @Prop()
  phone?: string;

  @Prop()
  email?: string;

  @Prop()
  website?: string;

  // Location
  @Prop({ type: Number })
  latitude?: number;

  @Prop({ type: Number })
  longitude?: number;

  @Prop()
  city?: string;

  @Prop()
  district?: string;

  @Prop()
  ward?: string;

  // Operating hours
  @Prop({ type: [Number], default: [0, 1, 2, 3, 4, 5, 6] })
  openDays: number[]; // 0=CN, 1=T2, ..., 6=T7

  @Prop({ default: '08:00' })
  openTime: string; // HH:mm format

  @Prop({ default: '22:00' })
  closeTime: string; // HH:mm format

  // Status and settings
  @Prop({ enum: ['pending', 'active', 'suspended', 'closed'], default: 'pending' })
  status: string;

  @Prop({ default: true })
  isOpen: boolean; // Current open/closed status

  @Prop({ default: true })
  isAcceptingOrders: boolean;

  @Prop({ default: false })
  isDeliveryAvailable: boolean;

  @Prop({ default: false })
  isPickupAvailable: boolean;

  // Performance metrics
  @Prop({ default: 0, min: 0, max: 5 })
  rating: number;

  @Prop({ default: 0 })
  reviewCount: number;

  @Prop({ default: 0 })
  orderCount: number;

  @Prop({ default: 0 })
  totalRevenue: number;

  // Delivery settings
  @Prop({ default: '30-45 phút' })
  deliveryTime: string;

  @Prop({ default: 0 })
  deliveryFee: number;

  @Prop({ default: 50000 })
  minOrderAmount: number;

  @Prop({ default: 10000 })
  freeDeliveryThreshold: number;

  @Prop({ default: 5000 })
  maxDeliveryDistance: number; // in meters

  // Category and tags
  @Prop()
  category?: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  // Social and marketing
  @Prop({ default: 0 })
  followersCount: number;

  @Prop({ default: 0 })
  likesCount: number;

  @Prop({ default: 0 })
  sharesCount: number;

  // Verification and compliance
  @Prop({ default: false })
  isVerified: boolean;

  @Prop({ default: false })
  isPremium: boolean;

  @Prop({ default: false })
  isFeatured: boolean;

  @Prop({ default: Date.now })
  joinedAt: Date;

  @Prop()
  verifiedAt?: Date;

  // Analytics and tracking
  @Prop({ default: 0 })
  viewCount: number;

  @Prop({ default: 0 })
  clickCount: number;

  @Prop({ default: 0 })
  conversionRate: number;

  // Settings
  @Prop({ default: true })
  autoAcceptOrders: boolean;

  @Prop({ default: 15 })
  preparationTime: number; // in minutes

  @Prop({ default: true })
  allowSpecialRequests: boolean;

  @Prop({ default: true })
  allowCustomization: boolean;
}

export const RestaurantSchema = SchemaFactory.createForClass(Restaurant);

// Indexes for efficient queries
RestaurantSchema.index({ ownerUserId: 1 });
RestaurantSchema.index({ status: 1, isActive: 1 });
RestaurantSchema.index({ location: '2dsphere' }); // Geospatial index
RestaurantSchema.index({ category: 1, status: 1 });
RestaurantSchema.index({ rating: -1, reviewCount: -1 });
RestaurantSchema.index({ isFeatured: 1, status: 1 });
RestaurantSchema.index({ isVerified: 1, status: 1 });
RestaurantSchema.index({ tags: 1 });
RestaurantSchema.index({ city: 1, district: 1 });
RestaurantSchema.index({ deliveryFee: 1, minOrderAmount: 1 });
RestaurantSchema.index({ createdAt: -1 });
RestaurantSchema.index({ orderCount: -1 });
RestaurantSchema.index({ totalRevenue: -1 });
RestaurantSchema.index({ isOpen: 1, status: 1 });


