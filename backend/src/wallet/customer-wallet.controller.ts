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
    const actor = resolveActorRefFromReq(req, 'customer');
    if (!actor.actorId) {
      // Trả về số dư 0 nếu chưa có actorId
      return { balance: 0, pendingBalance: 0, totalDeposits: 0, totalWithdrawals: 0, isActive: false };
    }
    return this.walletService.getBalanceForActor(actor);
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

