import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ItemOptionSeparateDocument = HydratedDocument<ItemOptionSeparate>;

@Schema({ timestamps: true })
export class ItemOptionSeparate {
  @Prop({ type: Types.ObjectId, ref: 'Item', required: true })
  itemId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: ['single', 'multiple'] })
  type: 'single' | 'multiple';

  @Prop({ default: false })
  required: boolean;

  @Prop({ default: 0 })
  position: number;

  @Prop({ default: true })
  isActive: boolean;
}

export const ItemOptionSeparateSchema = SchemaFactory.createForClass(ItemOptionSeparate);

// Indexes for better performance
ItemOptionSeparateSchema.index({ itemId: 1, position: 1 });
ItemOptionSeparateSchema.index({ itemId: 1, isActive: 1 });
ItemOptionSeparateSchema.index({ name: 1 });

