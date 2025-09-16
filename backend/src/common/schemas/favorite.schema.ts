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
  userId: Types.ObjectId;

  @Prop({ enum: FavoriteType, required: true })
  type: FavoriteType;

  @Prop({ type: Types.ObjectId, ref: 'Restaurant' })
  restaurantId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Item' })
  itemId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Category' })
  categoryId?: Types.ObjectId;

  @Prop()
  notes?: string; // User's personal notes

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  metadata?: Record<string, any>;
}

export const FavoriteSchema = SchemaFactory.createForClass(Favorite);

// Indexes for efficient queries
FavoriteSchema.index({ userId: 1, type: 1, isActive: 1 });
FavoriteSchema.index({ userId: 1, restaurantId: 1, isActive: 1 });
FavoriteSchema.index({ userId: 1, itemId: 1, isActive: 1 });
FavoriteSchema.index({ userId: 1, categoryId: 1, isActive: 1 });
FavoriteSchema.index({ restaurantId: 1, isActive: 1 });
FavoriteSchema.index({ itemId: 1, isActive: 1 });
FavoriteSchema.index({ categoryId: 1, isActive: 1 });
// Prevent duplicate favorites
FavoriteSchema.index({ userId: 1, type: 1, restaurantId: 1 }, { unique: true, sparse: true });
FavoriteSchema.index({ userId: 1, type: 1, itemId: 1 }, { unique: true, sparse: true });
FavoriteSchema.index({ userId: 1, type: 1, categoryId: 1 }, { unique: true, sparse: true });
