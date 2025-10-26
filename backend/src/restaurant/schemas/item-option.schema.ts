import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ItemOptionDocument = HydratedDocument<ItemOption>;

@Schema({ _id: false })
export class OptionChoice {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, default: 0 })
  price: number;

  @Prop({ default: false })
  isDefault?: boolean;

  @Prop({ default: true })
  isActive?: boolean;
}

export const OptionChoiceSchema = SchemaFactory.createForClass(OptionChoice);

@Schema({ _id: false })
export class ItemOption {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: ['single', 'multiple'] })
  type: 'single' | 'multiple';

  @Prop({ default: false })
  required: boolean;

  @Prop({ type: [OptionChoiceSchema], default: [] })
  choices: OptionChoice[];

  @Prop({ default: 0 })
  position: number;

  @Prop({ default: true })
  isActive: boolean;
}

export const ItemOptionSchema = SchemaFactory.createForClass(ItemOption);
