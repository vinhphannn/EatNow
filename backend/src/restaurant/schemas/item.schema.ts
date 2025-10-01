import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ItemDocument = HydratedDocument<Item>;

@Schema({ timestamps: true })
export class Item {
  @Prop({ type: Types.ObjectId, ref: 'Restaurant', required: true })
  restaurantId: any;

  @Prop({ type: Types.ObjectId, ref: 'Category' })
  categoryId?: any;

  @Prop({ required: true })
  name: string;

  // Tên đã loại dấu và lowercase để search prefix nhanh
  @Prop()
  nameSearch?: string;

  @Prop({ required: true })
  price: number;

  @Prop({ enum: ['food', 'drink'], required: true })
  type: 'food' | 'drink';

  @Prop()
  description?: string;

  @Prop()
  imageUrl?: string;

  @Prop({ type: Types.ObjectId, ref: 'Image' })
  imageId?: any;

  // Đánh giá và review
  @Prop({ default: 0, min: 0, max: 5 })
  rating?: number;

  @Prop({ default: 0 })
  reviewCount?: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0 })
  position: number;

  // Điểm phổ biến để sắp xếp nổi bật
  @Prop({ default: 0 })
  popularityScore: number;
}

export const ItemSchema = SchemaFactory.createForClass(Item);

// Indexes tối ưu truy vấn
ItemSchema.index({ restaurantId: 1, categoryId: 1, position: 1 });
ItemSchema.index({ restaurantId: 1, popularityScore: -1 });
ItemSchema.index({ restaurantId: 1, nameSearch: 1 });
ItemSchema.index({ isActive: 1 });


