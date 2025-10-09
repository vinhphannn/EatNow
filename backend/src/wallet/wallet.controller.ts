import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(private readonly wallet: WalletService) {}

  @Post('transactions')
  async createTxn(@Body() body: { userType: 'driver' | 'restaurant'; userId: string; type: 'credit' | 'debit'; amount: number; orderId?: string }) {
    return this.wallet.createTxn(body);
  }

  @Get('transactions')
  async listTxns(@Query('userType') userType: 'driver' | 'restaurant', @Query('userId') userId: string, @Query('limit') limit?: string) {
    return this.wallet.listTxns(userType, userId, Number(limit) || 10);
  }
}





