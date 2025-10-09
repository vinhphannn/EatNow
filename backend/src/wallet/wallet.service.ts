import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { WalletTransaction, WalletTransactionDocument } from './schemas/wallet-transaction.schema';

@Injectable()
export class WalletService {
  constructor(
    @InjectModel(WalletTransaction.name) private readonly txnModel: Model<WalletTransactionDocument>,
  ) {}

  async createTxn(payload: { userType: 'driver' | 'restaurant'; userId: string; type: 'credit' | 'debit'; amount: number; orderId?: string }) {
    const doc = await this.txnModel.create({
      userType: payload.userType,
      userId: new Types.ObjectId(payload.userId),
      type: payload.type,
      amount: Math.max(0, Number(payload.amount || 0)),
      orderId: payload.orderId ? new Types.ObjectId(payload.orderId) : undefined,
      createdAt: new Date(),
    } as any);
    return { id: doc._id };
  }

  async listTxns(userType: 'driver' | 'restaurant', userId: string, limit: number = 10) {
    const docs = await this.txnModel
      .find({ userType, userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(Math.min(50, Math.max(1, limit)))
      .lean();
    return docs.map((d: any) => ({ id: d._id, userType: d.userType, userId: d.userId, type: d.type, amount: d.amount, orderId: d.orderId, createdAt: d.createdAt }));
  }
}





