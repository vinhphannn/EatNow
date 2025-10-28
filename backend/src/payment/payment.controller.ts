import { Controller, Post, Body, Get, Param, Req, UseGuards } from '@nestjs/common';
import { MomoService } from './momo.service';
import { WalletService } from '../wallet/wallet.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Logger } from '@nestjs/common';

/**
 * Payment Controller - Xử lý thanh toán qua MoMo và các providers khác
 * 
 * Endpoints:
 * - POST /payment/deposit - Nạp tiền vào ví qua MoMo
 * - POST /payment/withdraw - Rút tiền từ ví ra MoMo
 * - POST /payment/order - Thanh toán đơn hàng
 * - POST /payment/callback - MoMo callback handler
 * - GET /payment/:transactionId - Lấy thông tin giao dịch
 */
@Controller('payment')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(
    private readonly momoService: MomoService,
    private readonly walletService: WalletService,
  ) {}

  /**
   * Nạp tiền vào ví qua MoMo
   * POST /api/v1/payment/deposit
   * Body: { amount, provider, ownerType }
   */
  @Post('deposit')
  @UseGuards(JwtAuthGuard)
  async deposit(@Req() req: any, @Body() body: { amount: number; provider: string; ownerType?: string }) {
    try {
      const userId = req.user.id;
      const ownerType: 'customer' | 'restaurant' | 'driver' | 'admin' = 
        (body.ownerType || this.detectOwnerType(req.user)) as any;
      
      this.logger.log(`Nạp tiền: userId=${userId}, amount=${body.amount}, provider=${body.provider}`);

      // Tạo transaction trong database (pending)
      const transaction = await this.walletService.depositViaProvider(
        ownerType,
        userId,
        body.amount,
        body.provider
      );

      // Nếu provider là MoMo, tạo payment URL
      if (body.provider === 'momo') {
        const paymentUrl = await this.momoService.createPaymentUrl({
          orderId: transaction._id.toString(),
          orderInfo: `Nạp tiền vào ví ${body.amount} VND`,
          amount: body.amount,
          extraData: JSON.stringify({ transactionId: transaction._id.toString(), ownerType }),
        });

        // Update transaction với payment URL
        await this.walletService.updateTransactionProviderUrl(
          transaction._id.toString(),
          paymentUrl.payUrl
        );

        this.logger.log(`✅ Returning payment response:`, {
          success: true,
          transactionId: transaction._id.toString(),
          paymentUrl: paymentUrl.payUrl,
          redirectUrl: paymentUrl.payUrl,
        });

        return {
          success: true,
          transactionId: transaction._id.toString(),
          paymentUrl: paymentUrl.payUrl,
          redirectUrl: paymentUrl.payUrl,
        };
      }

      return {
        success: true,
        transactionId: transaction._id.toString(),
        message: 'Đang xử lý thanh toán',
      };

    } catch (error) {
      this.logger.error(`Lỗi nạp tiền: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Rút tiền từ ví
   * POST /api/v1/payment/withdraw
   * Body: { amount, provider, phoneNumber }
   */
  @Post('withdraw')
  @UseGuards(JwtAuthGuard)
  async withdraw(@Req() req: any, @Body() body: { amount: number; provider: string; phoneNumber?: string }) {
    try {
      const userId = req.user.id;
      const ownerType = this.detectOwnerType(req.user);
      
      this.logger.log(`Rút tiền: userId=${userId}, amount=${body.amount}, provider=${body.provider}`);

      // Tạo transaction và trừ balance
      const transaction = await this.walletService.withdrawFromWallet(
        ownerType,
        userId,
        body.amount,
        body.provider,
        body.phoneNumber
      );

      return {
        success: true,
        transactionId: transaction._id.toString(),
        status: 'processing',
        message: 'Yêu cầu rút tiền đã được xử lý',
      };

    } catch (error) {
      this.logger.error(`Lỗi rút tiền: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Thanh toán đơn hàng qua MoMo
   * POST /api/v1/payment/order
   * Body: { orderId, amount, orderCode }
   */
  @Post('order')
  @UseGuards(JwtAuthGuard)
  async payOrder(@Req() req: any, @Body() body: { orderId: string; amount: number; orderCode: string; restaurantId: string; method?: 'wallet' | 'momo' }) {
    try {
      const userId = req.user.id;
      
      this.logger.log(`Thanh toán đơn hàng: orderId=${body.orderId}, amount=${body.amount}`);

      // Nếu chọn thanh toán bằng ví
      if (body.method === 'wallet') {
        try {
          // Đảm bảo tạo ví nhà hàng sớm để không xảy ra tình trạng “không có ví”
          if (body.restaurantId) {
            await this.walletService.getWalletForActor('restaurant', body.restaurantId);
          }

          const tx = await this.walletService.payOrderFromWallet('customer', userId, body.amount, body.orderId, body.orderCode);
          // Chỉ xác nhận đã giữ tiền (escrow), credit cho nhà hàng sẽ thực hiện khi đơn delivered
          return { success: true, method: 'wallet', status: 'escrowed', transactionId: tx._id };
        } catch (err: any) {
          // Số dư không đủ → yêu cầu nạp thêm
          if (err?.message?.startsWith('Số dư không đủ')) {
            return { success: false, needDeposit: true, message: err.message };
          }
          throw err;
        }
      }

      // Mặc định: tạo thanh toán qua MoMo
      // Tạo transaction trong database
      const transaction = await this.walletService.depositViaProvider(
        'customer',
        userId,
        body.amount,
        'momo',
        body.orderId
      );

      // Tạo MoMo payment URL
      const paymentUrl = await this.momoService.createPaymentUrl({
        orderId: transaction._id.toString(),
        orderInfo: `Thanh toán đơn hàng #${body.orderCode}`,
        amount: body.amount,
        extraData: JSON.stringify({ 
          orderId: body.orderId,
          userId,
          transactionId: transaction._id.toString()
        }),
      });

      return {
        success: true,
        transactionId: transaction._id.toString(),
        paymentUrl: paymentUrl.payUrl,
        redirectUrl: paymentUrl.payUrl,
      };

    } catch (error) {
      this.logger.error(`Lỗi thanh toán đơn hàng: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Manual confirm deposit for testing
   * POST /api/v1/payment/confirm-deposit
   */
  @Post('confirm-deposit')
  @UseGuards(JwtAuthGuard)
  async confirmDeposit(@Req() req: any, @Body() body: { transactionId: string }) {
    try {
      const userId = req.user.id;
      this.logger.log(`Manual confirm deposit: userId=${userId}, transactionId=${body.transactionId}`);

      // Confirm deposit manually
      await this.walletService.confirmDeposit(
        body.transactionId,
        `manual_${Date.now()}`,
        { manual: true, userId }
      );

      this.logger.log(`✅ Manual deposit confirmed: ${body.transactionId}`);

      return { 
        success: true, 
        message: 'Deposit confirmed successfully',
        transactionId: body.transactionId
      };

    } catch (error) {
      this.logger.error(`Lỗi manual confirm deposit: ${error.message}`, error.stack);
      return { success: false, message: error.message };
    }
  }

  @Post('test-confirm/:transactionId')
  @UseGuards(JwtAuthGuard)
  async testConfirmDeposit(@Param('transactionId') transactionId: string) {
    try {
      this.logger.log(`🧪 Test confirm deposit: ${transactionId}`);
      
      await this.walletService.confirmDeposit(
        transactionId,
        `test_${Date.now()}`,
        { test: true }
      );
      
      this.logger.log(`✅ Test deposit confirmed: ${transactionId}`);
      
      return { 
        success: true, 
        message: 'Test deposit confirmed successfully',
        transactionId
      };
    } catch (error) {
      this.logger.error(`❌ Test confirm failed: ${error.message}`, error.stack);
      return { success: false, message: error.message };
    }
  }
  @Post('momo/callback')
  async momoCallback(@Body() callbackData: any) {
    try {
      this.logger.log(`🔔 MoMo callback received: ${JSON.stringify(callbackData)}`);

      // Verify signature
      const isValid = this.momoService.verifyCallback(callbackData);
      if (!isValid) {
        this.logger.error('❌ Invalid MoMo callback signature');
        return { success: false, message: 'Invalid signature' };
      }

      const { orderId, amount, extraData, resultCode } = callbackData;

      // Parse extraData để lấy transactionId
      const parsedData = JSON.parse(extraData || '{}');
      const transactionId = parsedData.transactionId || orderId;

      this.logger.log(`🔄 Processing callback for transactionId: ${transactionId}, amount: ${amount}`);

      if (Number(resultCode) === 0) {
        // Update transaction status to completed
        await this.walletService.confirmDeposit(
          transactionId,
          callbackData.transactionId || orderId,
          callbackData
        );
        this.logger.log(`✅ Transaction confirmed: ${transactionId}`);
        return { success: true, message: 'Payment processed successfully' };
      } else {
        // Đánh dấu thất bại/cancelled và hoàn pendingBalance
        const status = Number(resultCode) === 1006 ? 'cancelled' : 'failed';
        await this.walletService.updateTransactionStatus(transactionId, status);
        this.logger.warn(`⚠️ Transaction ${transactionId} marked as ${status} (resultCode=${resultCode})`);
        return { success: false, message: 'Payment failed', resultCode };
      }

    } catch (error) {
      this.logger.error(`❌ Lỗi xử lý MoMo callback: ${error.message}`, error.stack);
      return { success: false, message: error.message };
    }
  }

  /**
   * Test MoMo callback manually
   * POST /api/v1/payment/test-callback
   */
  @Post('test-callback')
  async testCallback(@Body() body: { transactionId: string; amount: number }) {
    try {
      this.logger.log(`🧪 Testing callback for transactionId: ${body.transactionId}`);

      // Simulate MoMo callback data
      const mockCallbackData = {
        orderId: body.transactionId,
        amount: body.amount,
        resultCode: 0,
        message: 'Success',
        extraData: JSON.stringify({ transactionId: body.transactionId }),
        transactionId: `momo_${Date.now()}`,
        signature: 'test_signature'
      };

      // Process callback
      await this.walletService.confirmDeposit(
        body.transactionId,
        mockCallbackData.transactionId,
        mockCallbackData
      );

      this.logger.log(`✅ Test callback successful: ${body.transactionId}`);

      return { 
        success: true, 
        message: 'Test callback processed successfully',
        transactionId: body.transactionId
      };

    } catch (error) {
      this.logger.error(`❌ Test callback failed: ${error.message}`, error.stack);
      return { success: false, message: error.message };
    }
  }

  /**
   * Test endpoint - không cần auth
   * GET /api/v1/payment/test
   */
  @Get('test')
  async test() {
    return { message: 'Payment controller is working', timestamp: new Date().toISOString() };
  }

  /**
   * Check transaction status
   * GET /api/v1/payment/check/:transactionId
   */
  @Get('check/:transactionId')
  @UseGuards(JwtAuthGuard)
  async checkTransaction(@Param('transactionId') transactionId: string) {
    try {
      this.logger.log(`🔍 Checking transaction: ${transactionId}`);

      let transaction = await this.walletService.getTransactionById(transactionId);
      
      if (!transaction) {
        return { success: false, message: 'Transaction not found' };
      }

      // Auto-cancel nếu pending quá hạn (ví dụ > 120s kể từ khi tạo)
      if (transaction.status === 'pending' && transaction.createdAt) {
        const createdAtMs = new Date(transaction.createdAt as any).getTime();
        const ageMs = Date.now() - createdAtMs;
        const expiryMs = 120 * 1000; // 2 phút
        if (ageMs > expiryMs) {
          await this.walletService.updateTransactionStatus(transactionId, 'cancelled');
          transaction = await this.walletService.getTransactionById(transactionId);
          this.logger.warn(`⏰ Transaction ${transactionId} expired -> cancelled`);
        }
      }

      return {
        success: true,
        transaction: {
          id: transaction._id,
          status: transaction.status,
          amount: transaction.amount,
          type: transaction.type,
          description: transaction.description,
          createdAt: transaction.createdAt,
          updatedAt: transaction.updatedAt
        }
      };

    } catch (error) {
      this.logger.error(`❌ Error checking transaction: ${error.message}`, error.stack);
      return { success: false, message: error.message };
    }
  }

  /**
   * Lấy thông tin giao dịch
   * GET /api/v1/payment/transaction/:transactionId
   */
  @Get('transaction/:transactionId')
  @UseGuards(JwtAuthGuard)
  async getTransaction(@Param('transactionId') transactionId: string, @Req() req: any) {
    const userId = req.user.id;
    
    // TODO: Implement get transaction logic
    return {
      transactionId,
      status: 'pending',
      message: 'Transaction info not yet implemented',
    };
  }

  /**
   * Detect owner type từ user object
   */
  private detectOwnerType(user: any): 'customer' | 'restaurant' | 'driver' | 'admin' {
    if (user.role === 'customer') return 'customer';
    if (user.role === 'restaurant') return 'restaurant';
    if (user.role === 'driver') return 'driver';
    return 'admin';
  }
}

