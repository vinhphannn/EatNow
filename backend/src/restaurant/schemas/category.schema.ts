import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CategoryDocument = HydratedDocument<Category>;

@Schema({ timestamps: true })
export class Category {
  @Prop({ type: Types.ObjectId, ref: 'Restaurant', required: false })
  restaurantId?: any;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
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

export const CategorySchema = SchemaFactory.createForClass(Category);

// Indexes for better performance
CategorySchema.index({ slug: 1 });
CategorySchema.index({ position: 1 });
CategorySchema.index({ isActive: 1 });
CategorySchema.index({ restaurantId: 1 });

