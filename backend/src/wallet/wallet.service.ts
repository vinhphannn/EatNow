import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Wallet, WalletDocument } from './schemas/wallet.schema';
import { WalletTransaction, WalletTransactionDocument } from './schemas/wallet-transaction.schema';
import { Restaurant, RestaurantDocument } from '../restaurant/schemas/restaurant.schema';

@Injectable()
export class WalletService {
  constructor(
    @InjectModel(Wallet.name) private walletModel: Model<WalletDocument>,
    @InjectModel(WalletTransaction.name) private walletTransactionModel: Model<WalletTransactionDocument>,
    @InjectModel(Restaurant.name) private restaurantModel: Model<RestaurantDocument>,
  ) {}

  async getWalletByRestaurantId(restaurantId: string): Promise<WalletDocument> {
    let wallet = await this.walletModel.findOne({ 
      restaurantId: new Types.ObjectId(restaurantId),
      isActive: true 
    });

    if (!wallet) {
      // Create wallet if not exists
      const newWallet = new this.walletModel({
        restaurantId: new Types.ObjectId(restaurantId),
        balance: 0,
        pendingBalance: 0,
        totalDeposits: 0,
        totalWithdrawals: 0,
        isActive: true,
      });
      wallet = await newWallet.save();
    }

    return wallet;
  }

  async createWallet(restaurantId: string): Promise<WalletDocument> {
    const wallet = new this.walletModel({
      restaurantId: new Types.ObjectId(restaurantId),
      balance: 0,
      pendingBalance: 0,
      totalDeposits: 0,
      totalWithdrawals: 0,
      isActive: true,
    });

    return await wallet.save();
  }

  async getWalletBalance(restaurantId: string) {
    const wallet = await this.getWalletByRestaurantId(restaurantId);
    return {
      balance: wallet.balance,
      pendingBalance: wallet.pendingBalance,
      totalDeposits: wallet.totalDeposits,
      totalWithdrawals: wallet.totalWithdrawals,
    };
  }

  async getWalletTransactions(restaurantId: string, limit: number = 50) {
    const wallet = await this.getWalletByRestaurantId(restaurantId);
    
    const transactions = await this.walletTransactionModel
      .find({ 
        restaurantId: new Types.ObjectId(restaurantId) 
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return transactions;
  }

  async deposit(restaurantId: string, amount: number, description?: string) {
    if (amount <= 0) {
      throw new BadRequestException('Số tiền nạp phải lớn hơn 0');
    }

    const wallet = await this.getWalletByRestaurantId(restaurantId);

    // Create transaction
    const transaction = new this.walletTransactionModel({
      walletId: wallet._id,
      restaurantId: new Types.ObjectId(restaurantId),
      type: 'deposit',
      amount,
      description: description || `Nạp tiền vào ví`,
      status: 'pending',
    });

    await transaction.save();

    // Update wallet pending balance
    await this.walletModel.findByIdAndUpdate(wallet._id, {
      $inc: { pendingBalance: amount }
    });

    return transaction;
  }

  async withdraw(restaurantId: string, amount: number, description?: string) {
    if (amount <= 0) {
      throw new BadRequestException('Số tiền rút phải lớn hơn 0');
    }

    const wallet = await this.getWalletByRestaurantId(restaurantId);

    if (wallet.balance < amount) {
      throw new BadRequestException('Số dư không đủ để rút tiền');
    }

    // Create transaction
    const transaction = new this.walletTransactionModel({
      walletId: wallet._id,
      restaurantId: new Types.ObjectId(restaurantId),
      type: 'withdraw',
      amount: -amount, // Negative for withdrawal
      description: description || `Rút tiền từ ví`,
      status: 'pending',
    });

    await transaction.save();

    // Update wallet balance
    await this.walletModel.findByIdAndUpdate(wallet._id, {
      $inc: { balance: -amount }
    });

    return transaction;
  }

  async processOrderPayment(restaurantId: string, orderId: string, orderCode: string, amount: number) {
    const wallet = await this.getWalletByRestaurantId(restaurantId);

    // Create transaction
    const transaction = new this.walletTransactionModel({
      walletId: wallet._id,
      restaurantId: new Types.ObjectId(restaurantId),
      type: 'order_payment',
      amount: -amount, // Negative for payment
      description: `Thanh toán đơn hàng #${orderCode}`,
      status: 'completed',
      orderId: new Types.ObjectId(orderId),
      orderCode,
    });

    await transaction.save();

    // Update wallet balance
    await this.walletModel.findByIdAndUpdate(wallet._id, {
      $inc: { balance: -amount }
    });

    return transaction;
  }

  async processRefund(restaurantId: string, orderId: string, orderCode: string, amount: number) {
    const wallet = await this.getWalletByRestaurantId(restaurantId);

    // Create transaction
    const transaction = new this.walletTransactionModel({
      walletId: wallet._id,
      restaurantId: new Types.ObjectId(restaurantId),
      type: 'refund',
      amount, // Positive for refund
      description: `Hoàn tiền đơn hàng #${orderCode}`,
      status: 'completed',
      orderId: new Types.ObjectId(orderId),
      orderCode,
    });

    await transaction.save();

    // Update wallet balance
    await this.walletModel.findByIdAndUpdate(wallet._id, {
      $inc: { balance: amount }
    });

    return transaction;
  }

  async updateTransactionStatus(transactionId: string, status: string) {
    const transaction = await this.walletTransactionModel.findById(transactionId);
    if (!transaction) {
      throw new NotFoundException('Giao dịch không tồn tại');
    }

    transaction.status = status;
    await transaction.save();

    // If completed, update wallet totals
    if (status === 'completed') {
      const wallet = await this.walletModel.findById(transaction.walletId);
      if (transaction.type === 'deposit') {
        await this.walletModel.findByIdAndUpdate(transaction.walletId, {
          $inc: { 
            balance: transaction.amount,
            pendingBalance: -transaction.amount,
            totalDeposits: transaction.amount
          }
        });
      } else if (transaction.type === 'withdraw') {
        await this.walletModel.findByIdAndUpdate(transaction.walletId, {
          $inc: { totalWithdrawals: Math.abs(transaction.amount) }
        });
      }
    }

    return transaction;
  }
}