import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type GlobalCategoryDocument = HydratedDocument<GlobalCategory>;

@Schema({ timestamps: true })
export class GlobalCategory {
  @Prop({ required: true, unique: true, trim: true })
  name: string;

  @Prop({ trim: true })
  description?: string;

  @Prop()
  icon?: string; // Emoji or icon class

  @Prop()
  imageUrl?: string;

  @Prop({ default: 0 })
  position: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ default: 0 })
  restaurantCount: number;

  @Prop({ default: 0 })
  orderCount: number;

  @Prop({ default: 0 })
  popularityScore: number;

  // SEO and search
  @Prop({ trim: true })
  slug?: string;

  @Prop({ trim: true })
  metaTitle?: string;

  @Prop({ trim: true })
  metaDescription?: string;

  @Prop({ type: [String], default: [] })
  keywords: string[];

  // Analytics
  @Prop({ default: 0 })
  viewCount: number;

  @Prop({ default: 0 })
  clickCount: number;

  @Prop({ default: 0 })
  conversionRate: number;

  // Parent-child relationship for subcategories
  @Prop({ type: String, ref: 'GlobalCategory' })
  parentCategoryId?: string;

  @Prop({ default: 0 })
  level: number; // 0=root, 1=subcategory, etc.

  @Prop({ default: true })
  isVisible: boolean;

  @Prop({ default: false })
  isFeatured: boolean;
}

export const GlobalCategorySchema = SchemaFactory.createForClass(GlobalCategory);

// Indexes for efficient queries
GlobalCategorySchema.index({ name: 1 }, { unique: true });
GlobalCategorySchema.index({ position: 1 });
GlobalCategorySchema.index({ isActive: 1, isVisible: 1 });
GlobalCategorySchema.index({ parentCategoryId: 1 });
GlobalCategorySchema.index({ slug: 1 });
GlobalCategorySchema.index({ popularityScore: -1 });
GlobalCategorySchema.index({ restaurantCount: -1 });
