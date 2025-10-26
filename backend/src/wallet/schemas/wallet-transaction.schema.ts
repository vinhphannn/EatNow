import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WalletTransactionDocument = WalletTransaction & Document;

@Schema({ timestamps: true })
export class WalletTransaction {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Wallet' })
  walletId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Restaurant' })
  restaurantId: Types.ObjectId;

  @Prop({ required: true, enum: ['deposit', 'withdraw', 'order_payment', 'refund', 'fee'] })
  type: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, enum: ['pending', 'completed', 'failed'], default: 'pending' })
  status: string;

  @Prop({ type: Types.ObjectId, ref: 'Order' })
  orderId?: Types.ObjectId;

  @Prop()
  orderCode?: string;

  @Prop({ type: Object })
  metadata?: any;
}

export const WalletTransactionSchema = SchemaFactory.createForClass(WalletTransaction);