import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ReviewDocument = HydratedDocument<Review>;

export enum ReviewType {
  RESTAURANT = 'restaurant',
  ITEM = 'item',
  DRIVER = 'driver',
}

@Schema({ timestamps: true })
export class Review {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Restaurant' })
  restaurantId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Item' })
  itemId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Driver' })
  driverId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Order' })
  orderId?: Types.ObjectId;

  @Prop({ enum: ReviewType, required: true })
  type: ReviewType;

  @Prop({ required: true, min: 1, max: 5 })
  rating: number;

  @Prop()
  comment?: string;

  @Prop({ type: [String] })
  images?: string[]; // URLs of review images

  @Prop({ default: false })
  isVerified: boolean; // Verified purchase

  @Prop({ default: 0 })
  helpfulCount: number; // How many people found this helpful

  @Prop({ default: false })
  isVisible: boolean; // For moderation

  @Prop()
  response?: string; // Restaurant/Driver response

  @Prop()
  responseAt?: Date;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);

// Indexes for efficient queries
ReviewSchema.index({ restaurantId: 1, type: 1, isVisible: 1 });
ReviewSchema.index({ itemId: 1, type: 1, isVisible: 1 });
ReviewSchema.index({ driverId: 1, type: 1, isVisible: 1 });
ReviewSchema.index({ userId: 1, orderId: 1 });
ReviewSchema.index({ rating: 1 });
ReviewSchema.index({ createdAt: -1 });
