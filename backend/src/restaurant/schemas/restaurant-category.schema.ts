import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type RestaurantCategoryDocument = HydratedDocument<RestaurantCategory>;

@Schema({ timestamps: true })
export class RestaurantCategory {
  @Prop({ type: Types.ObjectId, ref: 'Restaurant', required: true })
  restaurantId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  slug: string;

  @Prop({ default: '' })
  description: string;

  @Prop({ default: '🍽️' })
  icon: string;

  @Prop({ default: 'from-gray-400 to-gray-500' })
  color: string;

  @Prop({ default: 0 })
  position: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: '' })
  imageUrl: string;
}

export const RestaurantCategorySchema = SchemaFactory.createForClass(RestaurantCategory);

// Indexes for better performance
RestaurantCategorySchema.index({ restaurantId: 1 });
RestaurantCategorySchema.index({ slug: 1 });
RestaurantCategorySchema.index({ position: 1 });
RestaurantCategorySchema.index({ isActive: 1 });
