import { Controller, Get, Post, Body, UseGuards, Req, Query, Param } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WalletService } from '../../wallet/wallet.service';
import { MomoService } from '../../payment/momo.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { resolveActorRefFromReq } from '../../wallet/actor.utils';
import { Driver, DriverDocument } from '../schemas/driver.schema';

/**
 * Driver Wallet Controller
 * Endpoints cho driver để quản lý ví của họ
 */
@Controller('drivers/mine/wallet')
@UseGuards(JwtAuthGuard)
export class DriverWalletController {
  constructor(
    private readonly walletService: WalletService,
    private readonly momoService: MomoService,
    @InjectModel(Driver.name) private driverModel: Model<DriverDocument>,
  ) {}

  @Get('balance')
  async getBalance(@Req() req: any) {
    try {
      // console.log('🔍 Driver Wallet: Request user:', req?.user);
      
      // Tìm driver từ userId
      const driver = await this.driverModel.findOne({ userId: req.user.id });
      if (!driver) {
        // console.log('⚠️ Driver Wallet: Driver not found for userId:', req.user.id);
        return { balance: 0, pendingBalance: 0, escrowBalance: 0, totalDeposits: 0, totalWithdrawals: 0, isActive: false };
      }
      
      // console.log('🔍 Driver Wallet: Found driver:', driver._id);
      
      // Tạo actor với driverId
      const actor = { ownerType: 'driver' as const, actorId: driver._id.toString(), userId: req.user.id };
      // console.log('🔍 Driver Wallet: Resolved actor:', actor);
      
      const wallet = await this.walletService.getBalanceForActor(actor);
      // console.log('✅ Driver Wallet: Balance retrieved:', wallet);
      return wallet;
    } catch (error) {
      console.error('❌ Driver Wallet: Error getting balance:', error);
      throw error;
    }
  }

  @Get('transactions')
  async getTransactions(@Req() req: any, @Query('limit') limit?: string) {
    try {
      // Tìm driver từ userId
      const driver = await this.driverModel.findOne({ userId: req.user.id });
      if (!driver) {
        return [];
      }
      
      // Tạo actor với driverId
      const actor = { ownerType: 'driver' as const, actorId: driver._id.toString(), userId: req.user.id };
      const limitNum = limit ? parseInt(limit) : 50;
      return this.walletService.getTransactionsForActor(actor, limitNum);
    } catch (error) {
      console.error('❌ Driver Wallet: Error getting transactions:', error);
      return [];
    }
  }

  @Post('deposit')
  async deposit(@Req() req: any, @Body() body: { amount: number; provider: string }) {
    try {
      // Tìm driver từ userId
      const driver = await this.driverModel.findOne({ userId: req.user.id });
      if (!driver) {
        throw new Error('Driver not found');
      }

      const { amount, provider } = body;
      
      // Validate amount
      if (amount < 10000) {
        throw new Error('Số tiền nạp tối thiểu là 10,000 VND');
      }

      if (amount > 10000000) {
        throw new Error('Số tiền nạp tối đa là 10,000,000 VND');
      }

      // Create deposit transaction
      const transaction = await this.walletService.depositViaProvider(
        'driver',
        driver._id.toString(),
        amount,
        provider,
        `Nạp tiền vào ví driver qua ${provider}`
      );

      // Nếu provider là MoMo, tạo payment URL
      if (provider === 'momo') {
        const paymentUrl = await this.momoService.createPaymentUrl({
          orderId: transaction._id.toString(),
          orderInfo: `Nạp tiền vào ví driver ${amount} VND`,
          amount: amount,
          extraData: JSON.stringify({ transactionId: transaction._id.toString(), ownerType: 'driver' }),
        });

        // Update transaction với payment URL
        await this.walletService.updateTransactionProviderUrl(
          transaction._id.toString(),
          paymentUrl.payUrl
        );

        return {
          success: true,
          message: 'Tạo giao dịch nạp tiền thành công',
          transaction: {
            ...transaction.toObject(),
            paymentUrl: paymentUrl.payUrl
          }
        };
      }

      return {
        success: true,
        message: 'Tạo giao dịch nạp tiền thành công',
        transaction
      };
    } catch (error: any) {
      console.error('❌ Driver Wallet: Error depositing:', error);
      throw error;
    }
  }

  @Get('transaction/:transactionId')
  async getTransaction(@Req() req: any, @Param('transactionId') transactionId: string) {
    try {
      // Tìm driver từ userId
      const driver = await this.driverModel.findOne({ userId: req.user.id });
      if (!driver) {
        throw new Error('Driver not found');
      }

      const transaction = await this.walletService.getTransactionById(transactionId);
      
      if (!transaction) {
        throw new Error('Transaction not found');
      }

      // Kiểm tra transaction có thuộc về driver này không
      if (transaction.driverId?.toString() !== driver._id.toString()) {
        throw new Error('Unauthorized access to transaction');
      }

      return {
        success: true,
        transaction
      };
    } catch (error: any) {
      console.error('❌ Driver Wallet: Error getting transaction:', error);
      throw error;
    }
  }

  @Post('withdraw')
  async withdraw(@Req() req: any, @Body() body: { amount: number; phone: string; description?: string }) {
    try {
      // Tìm driver từ userId
      const driver = await this.driverModel.findOne({ userId: req.user.id });
      if (!driver) {
        throw new Error('Driver not found');
      }

      const { amount, phone, description } = body;
      
      // Validate amount
      if (amount < 50000) {
        throw new Error('Số tiền rút tối thiểu là 50,000 VND');
      }

      if (amount > 5000000) {
        throw new Error('Số tiền rút tối đa là 5,000,000 VND');
      }

      // Validate phone
      if (!phone || phone.length < 10) {
        throw new Error('Số điện thoại không hợp lệ');
      }

      // Create withdrawal request
      const transaction = await this.walletService.withdrawFromWallet(
        'driver',
        driver._id.toString(),
        amount,
        description || `Rút tiền về số ${phone}`,
        phone
      );

      return {
        success: true,
        message: 'Yêu cầu rút tiền đã được gửi',
        transaction
      };
    } catch (error: any) {
      console.error('❌ Driver Wallet: Error withdrawing:', error);
      throw error;
    }
  }
}
