import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Wallet, WalletDocument } from './schemas/wallet.schema';
import { WalletTransaction, WalletTransactionDocument } from './schemas/wallet-transaction.schema';

/**
 * Admin Wallet Controller
 * Endpoints cho admin để xem ví hệ thống (platform revenue)
 */
@Controller('admin/wallet')
@UseGuards(JwtAuthGuard)
export class AdminWalletController {
  constructor(
    private readonly walletService: WalletService,
    @InjectModel(Wallet.name) private readonly walletModel: Model<WalletDocument>,
    @InjectModel(WalletTransaction.name) private readonly walletTransactionModel: Model<WalletTransactionDocument>,
  ) {}

  @Get('balance')
  async getSystemWalletBalance(@Req() req: any) {
    try {
      // Tìm system wallet (isSystemWallet = true)
      let systemWallet = await this.walletModel.findOne({ isSystemWallet: true });
      
      // Nếu không có system wallet, tạo mới
      if (!systemWallet) {
        systemWallet = await this.walletModel.create({
          ownerType: 'admin',
          isSystemWallet: true,
          balance: 0,
          pendingBalance: 0,
          escrowBalance: 0,
          totalDeposits: 0,
          totalWithdrawals: 0,
          isActive: true,
        });
      }
      
      return {
        balance: systemWallet.balance || 0,
        pendingBalance: systemWallet.pendingBalance || 0,
        escrowBalance: systemWallet.escrowBalance || 0,
        totalDeposits: systemWallet.totalDeposits || 0,
        totalWithdrawals: systemWallet.totalWithdrawals || 0,
        isActive: systemWallet.isActive !== false,
      };
    } catch (error) {
      console.error('❌ Admin Wallet: Error getting balance:', error);
      // Return default values
      return { 
        balance: 0, 
        pendingBalance: 0, 
        escrowBalance: 0, 
        totalDeposits: 0, 
        totalWithdrawals: 0, 
        isActive: false 
      };
    }
  }

  @Get('transactions')
  async getTransactions(@Req() req: any) {
    try {
      // Get system wallet
      const systemWallet = await this.walletModel.findOne({ isSystemWallet: true });
      
      if (!systemWallet) {
        return [];
      }
      
      // Get transactions for system wallet
      const transactions = await this.walletTransactionModel
        .find({ walletId: systemWallet._id, isSystemTransaction: true })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();
      
      return transactions;
    } catch (error) {
      console.error('❌ Admin Wallet: Error getting transactions:', error);
      return [];
    }
  }
}

