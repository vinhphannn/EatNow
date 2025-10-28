import { Controller, Get, Post, Body, UseGuards, Req, Query } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { resolveActorRefFromReq } from './actor.utils';

/**
 * Customer Wallet Controller
 * Endpoints cho customer để quản lý ví của họ
 */
@Controller('customer/wallet')
@UseGuards(JwtAuthGuard)
export class CustomerWalletController {
  constructor(
    private readonly walletService: WalletService,
  ) {}

  @Get('balance')
  async getBalance(@Req() req: any) {
    try {
      console.log('🔍 Customer Wallet: Request user:', req?.user);
      const actor = resolveActorRefFromReq(req, 'customer');
      console.log('🔍 Customer Wallet: Resolved actor:', actor);
      
      if (!actor.actorId) {
        console.log('⚠️ Customer Wallet: No actorId found, returning zero balance');
        // Trả về số dư 0 nếu chưa có actorId
        return { balance: 0, pendingBalance: 0, escrowBalance: 0, totalDeposits: 0, totalWithdrawals: 0, isActive: false };
      }
      
      const wallet = await this.walletService.getBalanceForActor(actor);
      console.log('✅ Customer Wallet: Balance retrieved:', wallet);
      return wallet;
    } catch (error) {
      console.error('❌ Customer Wallet: Error getting balance:', error);
      throw error;
    }
  }

  @Get('transactions')
  async getTransactions(@Req() req: any, @Query('limit') limit?: string) {
    const actor = resolveActorRefFromReq(req, 'customer');
    if (!actor.actorId) {
      // Trả về mảng rỗng nếu chưa có actorId
      return [];
    }
    const limitNum = limit ? parseInt(limit) : 50;
    return this.walletService.getTransactionsForActor(actor, limitNum);
  }
}

