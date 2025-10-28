import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

/**
 * Admin Wallet Controller
 * Endpoints cho admin để xem ví hệ thống (platform revenue)
 */
@Controller('admin/wallet')
@UseGuards(JwtAuthGuard)
export class AdminWalletController {
  constructor(
    private readonly walletService: WalletService,
  ) {}

  @Get('balance')
  async getSystemWalletBalance(@Req() req: any) {
    try {
      // Get system wallet (tạo nếu chưa có)
      let systemWallet = await this.walletService.getWalletForActor('admin', 'system');
      
      // Nếu không có system wallet, tạo mới
      if (!systemWallet) {
        systemWallet = await this.walletService.createWallet({
          ownerType: 'admin',
          userId: null,
          restaurantId: null,
          driverId: null,
          balance: 0,
          pendingBalance: 0,
          escrowBalance: 0,
          totalDeposits: 0,
          totalWithdrawals: 0,
          isActive: true,
          isSystemWallet: true,
        });
      }
      
      return {
        balance: systemWallet.balance,
        pendingBalance: systemWallet.pendingBalance,
        escrowBalance: systemWallet.escrowBalance,
        totalDeposits: systemWallet.totalDeposits,
        totalWithdrawals: systemWallet.totalWithdrawals,
        isActive: systemWallet.isActive,
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
      const systemWallet = await this.walletService.getWalletForActor('admin', 'system');
      
      if (!systemWallet) {
        return [];
      }
      
      // Get transactions for system wallet
      const transactions = await this.walletService.getTransactionsForActor(
        { ownerType: 'admin', actorId: 'system' },
        50
      );
      
      return transactions;
    } catch (error) {
      console.error('❌ Admin Wallet: Error getting transactions:', error);
      return [];
    }
  }
}

