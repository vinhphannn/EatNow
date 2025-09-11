import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CartDocument = HydratedDocument<Cart>;

@Schema({ timestamps: true })
export class Cart {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: any;

  @Prop({ type: Types.ObjectId, ref: 'Item', required: true })
  itemId: any;

  @Prop({ type: Types.ObjectId, ref: 'Restaurant', required: true })
  restaurantId: any;

  @Prop({ required: true, min: 1 })
  quantity: number;

  @Prop()
  specialInstructions?: string; // Ghi chú đặc biệt cho món

  @Prop({ default: true })
  isActive: boolean; // Để soft delete
}

export const CartSchema = SchemaFactory.createForClass(Cart);

// Indexes
CartSchema.index({ userId: 1, isActive: 1 });
CartSchema.index({ userId: 1, restaurantId: 1, isActive: 1 });
CartSchema.index({ itemId: 1 });
