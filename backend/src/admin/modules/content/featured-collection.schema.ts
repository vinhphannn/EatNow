import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type FeaturedCollectionDocument = FeaturedCollection & Document;

@Schema({ timestamps: true })
export class FeaturedCollection {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ trim: true })
  subtitle?: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0 })
  position: number;

  @Prop({ default: 'grid' }) // 'grid' | 'carousel' | 'list'
  layout: string;

  // Display image for the collection section
  @Prop({ trim: true })
  imageUrl?: string;

  @Prop({ trim: true })
  color?: string; // hex color for theme

  @Prop({ default: false })
  isFeatured: boolean;

  // Personalization strategy
  // Main criteria controls the primary algorithm (e.g., highRated, bestSellers, trending, new, discount)
  @Prop({ trim: true, default: 'highRated' })
  mainCriteria?: string;

  @Prop({ type: Date })
  validFrom?: Date;

  @Prop({ type: Date })
  validUntil?: Date;
}

export const FeaturedCollectionSchema = SchemaFactory.createForClass(FeaturedCollection);
