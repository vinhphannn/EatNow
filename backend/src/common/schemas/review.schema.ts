import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ReviewDocument = HydratedDocument<Review>;

export enum ReviewType {
  RESTAURANT = 'restaurant',
  ITEM = 'item',
  DRIVER = 'driver',
  ORDER = 'order',
}

export enum ReviewStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  HIDDEN = 'hidden',
}

@Schema({ timestamps: true })
export class Review {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: any;

  @Prop({ enum: ReviewType, required: true })
  type: ReviewType;

  // Target of review (one of these will be set)
  @Prop({ type: Types.ObjectId, ref: 'Restaurant' })
  restaurantId?: any;

  @Prop({ type: Types.ObjectId, ref: 'Item' })
  itemId?: any;

  @Prop({ type: Types.ObjectId, ref: 'Driver' })
  driverId?: any;

  @Prop({ type: Types.ObjectId, ref: 'Order' })
  orderId?: any;

  // Review content
  @Prop({ required: true, min: 1, max: 5 })
  rating: number;

  @Prop({ trim: true })
  title?: string;

  @Prop({ trim: true })
  comment?: string;

  // Detailed ratings (for restaurants)
  @Prop({ min: 1, max: 5 })
  foodQuality?: number;

  @Prop({ min: 1, max: 5 })
  serviceQuality?: number;

  @Prop({ min: 1, max: 5 })
  deliverySpeed?: number;

  @Prop({ min: 1, max: 5 })
  packaging?: number;

  @Prop({ min: 1, max: 5 })
  valueForMoney?: number;

  // Media
  @Prop({ type: [Types.ObjectId], ref: 'Image' })
  imageIds?: any[];

  @Prop({ type: [String] })
  imageUrls?: string[];

  // Status and moderation
  @Prop({ enum: ReviewStatus, default: ReviewStatus.PENDING })
  status: ReviewStatus;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  moderatedBy?: any;

  @Prop()
  moderationNote?: string;

  @Prop()
  moderatedAt?: Date;

  // Helpfulness and engagement
  @Prop({ default: 0 })
  helpfulCount: number;

  @Prop({ default: 0 })
  unhelpfulCount: number;

  @Prop({ type: [Types.ObjectId], ref: 'User' })
  helpfulUsers?: any[];

  @Prop({ type: [Types.ObjectId], ref: 'User' })
  unhelpfulUsers?: any[];

  // Response from business
  @Prop({ type: Types.ObjectId, ref: 'User' })
  responseUserId?: any; // Restaurant owner or manager

  @Prop({ trim: true })
  response?: string;

  @Prop()
  responseAt?: Date;

  // Verification
  @Prop({ default: false })
  isVerified: boolean; // Verified purchase

  @Prop({ default: false })
  isAnonymous: boolean;

  // Analytics
  @Prop({ default: 0 })
  viewCount: number;

  @Prop({ default: 0 })
  shareCount: number;

  @Prop({ default: 0 })
  reportCount: number;

  // Tags and categorization
  @Prop({ type: [String] })
  tags?: string[];

  @Prop()
  sentiment?: string; // positive, negative, neutral

  // Flags
  @Prop({ default: false })
  isFeatured: boolean;

  @Prop({ default: false })
  isPinned: boolean;

  @Prop({ default: false })
  isEdited: boolean;

  @Prop()
  editedAt?: Date;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop()
  deletedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  deletedBy?: any;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);

// Indexes for efficient queries
ReviewSchema.index({ type: 1, restaurantId: 1, status: 1, rating: -1 });
ReviewSchema.index({ type: 1, itemId: 1, status: 1, rating: -1 });
ReviewSchema.index({ type: 1, driverId: 1, status: 1, rating: -1 });
ReviewSchema.index({ userId: 1, type: 1 });
ReviewSchema.index({ status: 1, createdAt: -1 });
ReviewSchema.index({ helpfulCount: -1 });
ReviewSchema.index({ isVerified: 1, rating: -1 });
ReviewSchema.index({ isFeatured: 1, status: 1 });
ReviewSchema.index({ orderId: 1 });
ReviewSchema.index({ createdAt: -1 });