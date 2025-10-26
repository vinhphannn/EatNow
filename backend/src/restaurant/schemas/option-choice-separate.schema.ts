import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type OptionChoiceSeparateDocument = HydratedDocument<OptionChoiceSeparate>;

@Schema({ timestamps: true })
export class OptionChoiceSeparate {
  @Prop({ type: Types.ObjectId, ref: 'ItemOptionSeparate', required: true })
  optionId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, default: 0 })
  price: number;

  @Prop({ default: false })
  isDefault: boolean;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0 })
  position: number;
}

export const OptionChoiceSeparateSchema = SchemaFactory.createForClass(OptionChoiceSeparate);

// Indexes for better performance
OptionChoiceSeparateSchema.index({ optionId: 1, position: 1 });
OptionChoiceSeparateSchema.index({ optionId: 1, isActive: 1 });
OptionChoiceSeparateSchema.index({ optionId: 1, isDefault: 1 });
OptionChoiceSeparateSchema.index({ name: 1 });

