import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Types } from 'mongoose';

export type WalletTransactionDocument = HydratedDocument<WalletTransaction>;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class WalletTransaction {
  @Prop({ enum: ['driver', 'restaurant'], required: true })
  userType: 'driver' | 'restaurant';

  @Prop({ type: Types.ObjectId, required: true })
  userId: any;

  @Prop({ enum: ['credit', 'debit'], required: true })
  type: 'credit' | 'debit';

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({ type: Types.ObjectId })
  orderId?: any;

  @Prop()
  createdAt: Date;
}

export const WalletTransactionSchema = SchemaFactory.createForClass(WalletTransaction);





