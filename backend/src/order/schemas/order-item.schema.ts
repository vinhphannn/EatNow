import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type OrderItemDocument = HydratedDocument<OrderItem>;

@Schema({ timestamps: true })
export class OrderItem {
  @Prop({ type: Types.ObjectId, ref: 'Order', required: true })
  orderId: any;

  @Prop({ type: Types.ObjectId })
  itemId: any;

  @Prop()
  nameSnapshot: string;

  @Prop()
  priceSnapshot: number;

  @Prop()
  quantity: number;

  @Prop({ type: Object })
  optionsSnapshot?: Record<string, any>;
}

export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

OrderItemSchema.index({ orderId: 1 });
