import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WalletDocument = Wallet & Document;

@Schema({ timestamps: true })
export class Wallet {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Restaurant' })
  restaurantId: Types.ObjectId;

  @Prop({ required: true, default: 0 })
  balance: number;

  @Prop({ required: true, default: 0 })
  pendingBalance: number;

  @Prop({ required: true, default: 0 })
  totalDeposits: number;

  @Prop({ required: true, default: 0 })
  totalWithdrawals: number;

  @Prop({ required: true, default: true })
  isActive: boolean;

  @Prop({ type: Object })
  metadata?: any;
}

export const WalletSchema = SchemaFactory.createForClass(Wallet);






















