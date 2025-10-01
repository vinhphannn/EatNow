import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type FavoriteDocument = HydratedDocument<Favorite>;

export enum FavoriteType {
  RESTAURANT = 'restaurant',
  ITEM = 'item',
  CATEGORY = 'category',
}

@Schema({ timestamps: true })
export class Favorite {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: any;

  @Prop({ enum: FavoriteType, required: true })
  type: FavoriteType;

  // Target of favorite (one of these will be set)
  @Prop({ type: Types.ObjectId, ref: 'Restaurant' })
  restaurantId?: any;

  @Prop({ type: Types.ObjectId, ref: 'Item' })
  itemId?: any;

  @Prop({ type: Types.ObjectId, ref: 'GlobalCategory' })
  categoryId?: any;

  @Prop({ default: 0 })
  priority: number; // For sorting favorites

  @Prop({ trim: true })
  note?: string; // User's personal note

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0 })
  viewCount: number; // How many times user viewed this favorite

  @Prop()
  lastViewedAt?: Date;
}

export const FavoriteSchema = SchemaFactory.createForClass(Favorite);

// Indexes for efficient queries
FavoriteSchema.index({ userId: 1, type: 1, isActive: 1 });
FavoriteSchema.index({ userId: 1, restaurantId: 1, isActive: 1 }, { unique: true });
FavoriteSchema.index({ userId: 1, itemId: 1, isActive: 1 }, { unique: true });
FavoriteSchema.index({ userId: 1, categoryId: 1, isActive: 1 }, { unique: true });
FavoriteSchema.index({ userId: 1, priority: -1, createdAt: -1 });
FavoriteSchema.index({ restaurantId: 1, type: 1 });
FavoriteSchema.index({ itemId: 1, type: 1 });
FavoriteSchema.index({ categoryId: 1, type: 1 });