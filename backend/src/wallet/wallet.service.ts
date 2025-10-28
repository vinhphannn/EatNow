import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Types, Connection, ClientSession } from 'mongoose';
import { Wallet, WalletDocument } from './schemas/wallet.schema';
import { WalletTransaction, WalletTransactionDocument } from './schemas/wallet-transaction.schema';
import { Restaurant, RestaurantDocument } from '../restaurant/schemas/restaurant.schema';
import { ActorRef, ActorType } from './actor.utils';

// Validation constants
const MIN_DEPOSIT_AMOUNT = 10000; // 10k VND
const MAX_DEPOSIT_AMOUNT = 10000000; // 10M VND
const MIN_WITHDRAW_AMOUNT = 50000; // 50k VND
const MAX_WITHDRAW_AMOUNT = 5000000; // 5M VND

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(
    @InjectModel(Wallet.name) private walletModel: Model<WalletDocument>,
    @InjectModel(WalletTransaction.name) private walletTransactionModel: Model<WalletTransactionDocument>,
    @InjectModel(Restaurant.name) private restaurantModel: Model<RestaurantDocument>,
    @InjectConnection() private connection: Connection,
  ) {}

  /**
   * Helper: Validate amount và throw error nếu không hợp lệ
   */
  private validateDepositAmount(amount: number): void {
    if (amount < MIN_DEPOSIT_AMOUNT) {
      throw new BadRequestException(`Số tiền nạp tối thiểu là ${MIN_DEPOSIT_AMOUNT.toLocaleString('vi-VN')} VND`);
    }
    if (amount > MAX_DEPOSIT_AMOUNT) {
      throw new BadRequestException(`Số tiền nạp tối đa là ${MAX_DEPOSIT_AMOUNT.toLocaleString('vi-VN')} VND`);
    }
  }

  private validateWithdrawAmount(amount: number): void {
    if (amount < MIN_WITHDRAW_AMOUNT) {
      throw new BadRequestException(`Số tiền rút tối thiểu là ${MIN_WITHDRAW_AMOUNT.toLocaleString('vi-VN')} VND`);
    }
    if (amount > MAX_WITHDRAW_AMOUNT) {
      throw new BadRequestException(`Số tiền rút tối đa là ${MAX_WITHDRAW_AMOUNT.toLocaleString('vi-VN')} VND`);
    }
  }

  /**
   * Helper: Check duplicate transaction (dựa trên providerTransactionId hoặc orderId)
   */
  private async checkDuplicateTransaction(
    filter: { providerTransactionId?: string; orderId?: string; type: string; walletId: string },
    session?: ClientSession
  ): Promise<boolean> {
    const query: any = { 
      type: filter.type,
      status: 'completed' 
    };
    
    // Add optional fields
    if (filter.providerTransactionId) {
      query.providerTransactionId = filter.providerTransactionId;
    }
    if (filter.orderId) {
      query.orderId = new Types.ObjectId(filter.orderId);
    }
    
    const existingTx = await this.walletTransactionModel.findOne(query, null, { session });
    if (existingTx) {
      this.logger.warn(`⚠️ Duplicate transaction detected: ${JSON.stringify(filter)}`);
      return true;
    }
    return false;
  }

  async getWalletByRestaurantId(restaurantId: string): Promise<WalletDocument> {
    let wallet = await this.walletModel.findOne({ 
      restaurantId: new Types.ObjectId(restaurantId),
      isActive: true 
    });

    if (!wallet) {
      // Create wallet if not exists
      const newWallet = new this.walletModel({
        ownerType: 'restaurant',
        restaurantId: new Types.ObjectId(restaurantId),
        balance: 0,
        pendingBalance: 0,
        escrowBalance: 0, // ✅ Thêm escrowBalance
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
      ownerType: 'restaurant',
      restaurantId: new Types.ObjectId(restaurantId),
      balance: 0,
      pendingBalance: 0,
      escrowBalance: 0, // ✅ Thêm escrowBalance
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
      escrowBalance: wallet.escrowBalance || 0, // ✅ Thêm escrowBalance
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

  /**
   * Lấy số dư theo ActorRef (thống nhất cho mọi actor)
   */
  async getBalanceForActor(actor: ActorRef) {
    const wallet = await this.getWalletForActor(actor.ownerType, actor.actorId);
    return {
      balance: wallet.balance,
      pendingBalance: wallet.pendingBalance,
      escrowBalance: wallet.escrowBalance || 0, // ✅ Thêm escrowBalance
      totalDeposits: wallet.totalDeposits,
      totalWithdrawals: wallet.totalWithdrawals,
      isActive: wallet.isActive,
    };
  }

  /**
   * Lấy lịch sử giao dịch theo ActorRef (thống nhất)
   */
  async getTransactionsForActor(actor: ActorRef, limit: number = 50) {
    const wallet = await this.getWalletForActor(actor.ownerType, actor.actorId);
    return this.getWalletTransactionsById(wallet._id.toString(), limit);
  }

  /**
   * Get transactions by wallet ID
   * Used by customer wallet
   */
  async getWalletTransactionsById(walletId: string, limit: number = 50) {
    const transactions = await this.walletTransactionModel
      .find({ 
        walletId: new Types.ObjectId(walletId) 
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

  /**
   * Thanh toán đơn hàng bằng số dư ví của customer
   * Escrow flow mới:
   * - ✅ Hold: trừ balance của customer, tăng escrowBalance của platform
   * - ✅ Release: khi delivered, chia tiền từ escrow platform cho restaurant + driver + platform fee
   * - ✅ Refund: khi cancel, chuyển escrow về balance của customer
   */
  async payOrderFromWallet(
    ownerType: 'customer' | 'restaurant' | 'driver' | 'admin',
    actorId: string,
    amount: number,
    orderId: string,
    orderCode: string
  ) {
    if (amount <= 0) {
      throw new BadRequestException('Số tiền thanh toán không hợp lệ');
    }

    const session = await this.connection.startSession();
    
    try {
      await session.withTransaction(async () => {
        // 1. Lấy hoặc tạo wallet
        const wallet = await this.getWalletForActor(ownerType, actorId);

        // 2. Atomic check: Số dư đủ không?
        if (wallet.balance < amount) {
          const need = amount - wallet.balance;
          throw new BadRequestException(`Số dư không đủ. Cần nạp thêm ${need.toLocaleString('vi-VN')} VND`);
        }

        // 3. Check duplicate: Đơn hàng đã thanh toán chưa?
        const isDuplicate = await this.checkDuplicateTransaction(
          { orderId, type: 'order_payment', walletId: wallet._id.toString() },
          session
        );
        
        if (isDuplicate) {
          throw new BadRequestException('Đơn hàng này đã được thanh toán');
        }

        // 4. Tạo transaction record (ESCROWED)
        const actorRef: any = {};
        if (ownerType === 'customer' || ownerType === 'admin') actorRef.userId = new Types.ObjectId(actorId);
        if (ownerType === 'restaurant') actorRef.restaurantId = new Types.ObjectId(actorId);
        if (ownerType === 'driver') actorRef.driverId = new Types.ObjectId(actorId);

        const transaction = await this.walletTransactionModel.create(
          [{
            walletId: wallet._id,
            ...actorRef,
            type: 'order_payment',
            amount: -amount,
            description: `Thanh toán đơn hàng #${orderCode}`,
            status: 'escrowed',
            orderId: new Types.ObjectId(orderId),
            orderCode,
            metadata: { ownerType, actorId },
          }],
          { session }
        );

        // 5. Atomic update: Trừ balance của customer và tăng escrowBalance của platform
        await this.walletModel.findByIdAndUpdate(
          wallet._id,
          { $inc: { balance: -amount } },
          { session }
        );

        // Tăng escrowBalance của platform wallet
        const platformWallet = await this.getWalletForActor('admin', 'system');
        await this.walletModel.findByIdAndUpdate(
          platformWallet._id,
          { $inc: { escrowBalance: amount } },
          { session }
        );

        this.logger.log(`✅ Escrow hold successful: orderId=${orderId}, amount=${amount}`);
        
        return transaction[0];
      });

      // Reload để return đúng transaction
      const wallet = await this.getWalletForActor(ownerType, actorId);
      const transactions = await this.walletTransactionModel
        .find({ 
          walletId: wallet._id,
          orderId: new Types.ObjectId(orderId),
          type: 'order_payment'
        })
        .sort({ createdAt: -1 })
        .limit(1)
        .lean();

      return transactions[0] as any;

    } catch (error) {
      this.logger.error(`❌ Escrow hold failed: ${error.message}`, error.stack);
      throw error;
    } finally {
      await session.endSession();
    }
  }

  /**
   * Release escrow khi đơn hoàn tất (delivered)
   * - Đổi transaction 'order_payment' từ escrowed → completed
   * - Giảm escrowBalance tương ứng
   */
  async releaseEscrowForOrder(
    ownerType: 'customer' | 'restaurant' | 'driver' | 'admin',
    actorId: string,
    orderId: string,
    amount: number
  ) {
    const session = await this.connection.startSession();
    try {
      await session.withTransaction(async () => {
        const wallet = await this.getWalletForActor(ownerType, actorId);

        // Tìm transaction escrow của order
        const tx = await this.walletTransactionModel.findOne({
          walletId: wallet._id,
          orderId: new Types.ObjectId(orderId),
          type: 'order_payment',
          status: 'escrowed',
        }, null, { session });

        if (!tx) {
          // Không có escrow → bỏ qua để không chặn dòng tiền khác
          this.logger.warn(`⚠️ No escrow transaction found for order ${orderId}`);
          return;
        }

        // Cập nhật transaction thành completed
        await this.walletTransactionModel.updateOne({ _id: tx._id }, { $set: { status: 'completed' } }, { session });

        // Giảm escrowBalance (tx.amount là âm, nên cần dùng Math.abs để có giá trị dương)
        await this.walletModel.updateOne({ _id: wallet._id }, { $inc: { escrowBalance: -Math.abs(tx.amount) } }, { session });

        this.logger.log(`✅ Escrow released for order ${orderId}`);
      });
    } finally {
      await session.endSession();
    }
  }

  /**
   * Refund escrow khi đơn bị cancel
   * - Đổi transaction status → cancelled
   * - Giảm escrowBalance và cộng lại balance
   */
  async refundEscrowForOrder(
    ownerType: 'customer' | 'restaurant' | 'driver' | 'admin',
    actorId: string,
    orderId: string
  ) {
    const session = await this.connection.startSession();
    try {
      await session.withTransaction(async () => {
        const wallet = await this.getWalletForActor(ownerType, actorId);
        const tx = await this.walletTransactionModel.findOne({
          walletId: wallet._id,
          orderId: new Types.ObjectId(orderId),
          type: 'order_payment',
          status: 'escrowed',
        }, null, { session });

        if (!tx) return;

        await this.walletTransactionModel.updateOne({ _id: tx._id }, { $set: { status: 'cancelled' } }, { session });
        await this.walletModel.updateOne({ _id: wallet._id }, { $inc: { escrowBalance: -Math.abs(tx.amount), balance: Math.abs(tx.amount) } }, { session });
        this.logger.log(`✅ Escrow refunded for order ${orderId}`);
      });
    } finally {
      await session.endSession();
    }
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
    } else if ((status === 'failed' || status === 'cancelled') && transaction.type === 'deposit') {
      // Hoàn trả pendingBalance nếu nạp tiền thất bại/hủy
      await this.walletModel.findByIdAndUpdate(transaction.walletId, {
        $inc: { pendingBalance: -transaction.amount }
      });
    }

    return transaction;
  }

  // ========== MULTI-ACTOR WALLET METHODS ==========

  /**
   * Get or create wallet cho bất kỳ actor nào
   */
  async getWalletForActor(
    ownerType: 'customer' | 'restaurant' | 'driver' | 'admin',
    actorId: string
  ): Promise<WalletDocument> {
    let query: any = { ownerType, isActive: true };

    // Tìm theo actor type
    if (ownerType === 'customer') {
      query.userId = new Types.ObjectId(actorId);
    } else if (ownerType === 'restaurant') {
      query.restaurantId = new Types.ObjectId(actorId);
    } else if (ownerType === 'driver') {
      query.driverId = new Types.ObjectId(actorId);
    } else if (ownerType === 'admin') {
      if (actorId === 'system') {
        // System wallet (platform wallet)
        query.isSystemWallet = true;
      } else {
        query.userId = new Types.ObjectId(actorId);
      }
    }

    // DEBUG: Log query để tìm ví
    this.logger.log(`🔍 getWalletForActor debug:`, {
      ownerType,
      actorId,
      query,
      isValidObjectId: Types.ObjectId.isValid(actorId)
    });

    let wallet = await this.walletModel.findOne(query);
    
    // DEBUG: Log kết quả tìm ví
    this.logger.log(`🔍 Wallet found:`, {
      found: !!wallet,
      walletId: wallet?._id,
      balance: wallet?.balance,
      pendingBalance: wallet?.pendingBalance,
      escrowBalance: wallet?.escrowBalance
    });

    if (!wallet) {
      // Tạo wallet nếu chưa có (bắt duplicate key để đảm bảo only-one-wallet-per-user)
      const walletData: any = {
        ownerType,
        balance: 0,
        pendingBalance: 0,
        escrowBalance: 0,
        totalDeposits: 0,
        totalWithdrawals: 0,
        isActive: true,
      };

      if (ownerType === 'customer') {
        walletData.userId = new Types.ObjectId(actorId);
      } else if (ownerType === 'restaurant') {
        walletData.restaurantId = new Types.ObjectId(actorId);
      } else if (ownerType === 'driver') {
        walletData.driverId = new Types.ObjectId(actorId);
      } else if (ownerType === 'admin') {
        if (actorId === 'system') {
          walletData.isSystemWallet = true;
        } else {
          walletData.userId = new Types.ObjectId(actorId);
        }
      }

      try {
        wallet = await this.walletModel.create(walletData);
      } catch (e: any) {
        // Nếu bị duplicate do race-condition → lấy lại ví hiện có
        if (e && (e.code === 11000 || String(e.message).includes('duplicate key'))) {
          wallet = await this.walletModel.findOne(query);
        } else {
          throw e;
        }
      }
    }

    return wallet;
  }

  /**
   * Nạp tiền vào ví với MoMo integration
   * ✅ VALIDATION: Check min/max amount
   * ✅ ATOMIC: Sử dụng transaction để tránh race condition
   */
  async depositViaProvider(
    ownerType: 'customer' | 'restaurant' | 'driver' | 'admin',
    actorId: string,
    amount: number,
    provider: string,
    orderId?: string,
    paymentUrl?: string
  ) {
    // ✅ Validation
    this.validateDepositAmount(amount);

    const wallet = await this.getWalletForActor(ownerType, actorId);

    // Tạo actor reference
    let actorRef: any = {};
    if (ownerType === 'customer' || ownerType === 'admin') {
      actorRef.userId = new Types.ObjectId(actorId);
    } else if (ownerType === 'restaurant') {
      actorRef.restaurantId = new Types.ObjectId(actorId);
    } else if (ownerType === 'driver') {
      actorRef.driverId = new Types.ObjectId(actorId);
    }

    // ✅ ATOMIC: Sử dụng session
    const session = await this.connection.startSession();
    
    try {
      let transactionResult: any;
      
      await session.withTransaction(async () => {
        // Tạo transaction
        const transactions = await this.walletTransactionModel.create(
          [{
            walletId: wallet._id,
            ...actorRef,
            type: 'deposit',
            amount,
            description: `Nạp tiền vào ví qua ${provider}`,
            status: 'pending',
            provider,
            providerPaymentUrl: paymentUrl,
            metadata: { ownerType, actorId },
          }],
          { session }
        );

        transactionResult = transactions[0];

        // Atomic update pending balance
        await this.walletModel.findByIdAndUpdate(
          wallet._id,
          { $inc: { pendingBalance: amount } },
          { session }
        );

        this.logger.log(`✅ Atomic deposit created: transactionId=${transactionResult._id}, amount=${amount}`);
      });

      return transactionResult;
    } catch (error) {
      this.logger.error(`❌ Atomic deposit failed: ${error.message}`, error.stack);
      throw error;
    } finally {
      await session.endSession();
    }
  }


  /**
   * Confirm deposit - Call từ MoMo callback
   * ✅ ATOMIC: Sử dụng transaction để đảm bảo consistency
   * ✅ DEDUPLICATION: Check duplicate providerTransactionId
   */
  async confirmDeposit(transactionId: string, providerTransactionId: string, callbackData?: any) {
    const session = await this.connection.startSession();

    try {
      let result: any;
      
      await session.withTransaction(async () => {
        // 1. Lấy transaction
        const transaction = await this.walletTransactionModel.findById(transactionId, null, { session });
        if (!transaction) {
          throw new NotFoundException('Giao dịch không tồn tại');
        }

        // 2. Đã processed rồi → return ngay
        if (transaction.status === 'completed') {
          this.logger.warn(`⚠️ Transaction ${transactionId} already completed (duplicate callback?)`);
          return transaction;
        }

        // 3. ✅ Check duplicate providerTransactionId
        const isDuplicate = await this.checkDuplicateTransaction(
          { providerTransactionId, type: 'deposit', walletId: transaction.walletId.toString() },
          session
        );
        
        if (isDuplicate) {
          this.logger.warn(`⚠️ Duplicate providerTransactionId detected: ${providerTransactionId}`);
          throw new BadRequestException('Giao dịch này đã được xử lý (duplicate callback)');
        }

        // 4. Update transaction status
        await this.walletTransactionModel.findByIdAndUpdate(
          transactionId,
          {
            status: 'completed',
            providerTransactionId,
            providerCallback: callbackData,
          },
          { session }
        );

        // 5. Atomic update wallet: Move pendingBalance → balance
        await this.walletModel.findByIdAndUpdate(
          transaction.walletId,
          {
            $inc: { 
              balance: transaction.amount,
              pendingBalance: -transaction.amount,
              totalDeposits: transaction.amount
            }
          },
          { session }
        );

        this.logger.log(`✅ Atomic confirm deposit successful: transactionId=${transactionId}, providerTransactionId=${providerTransactionId}`);
        
        result = transaction;
      });

      return result;
    } catch (error) {
      this.logger.error(`❌ Atomic confirm deposit failed: ${error.message}`, error.stack);
      throw error;
    } finally {
      await session.endSession();
    }
  }

  /**
   * Rút tiền từ ví
   * ✅ VALIDATION: Check min/max amount
   * ✅ VALIDATION: Check số dư đủ
   * ✅ ATOMIC: Sử dụng transaction để tránh race condition
   */
  async withdrawFromWallet(
    ownerType: 'customer' | 'restaurant' | 'driver' | 'admin',
    actorId: string,
    amount: number,
    provider: string,
    phoneNumber?: string
  ) {
    // ✅ Validation
    this.validateWithdrawAmount(amount);

    const session = await this.connection.startSession();

    try {
      let transactionResult: any;

      await session.withTransaction(async () => {
        // 1. Lấy wallet
        const wallet = await this.getWalletForActor(ownerType, actorId);

        // 2. ✅ Atomic check: Số dư đủ không?
        if (wallet.balance < amount) {
          const need = amount - wallet.balance;
          throw new BadRequestException(`Số dư không đủ để rút tiền. Cần nạp thêm ${need.toLocaleString('vi-VN')} VND`);
        }

        // 3. Tạo actor reference
        let actorRef: any = {};
        if (ownerType === 'customer' || ownerType === 'admin') {
          actorRef.userId = new Types.ObjectId(actorId);
        } else if (ownerType === 'restaurant') {
          actorRef.restaurantId = new Types.ObjectId(actorId);
        } else if (ownerType === 'driver') {
          actorRef.driverId = new Types.ObjectId(actorId);
        }

        // 4. Tạo transaction record
        const transactions = await this.walletTransactionModel.create(
          [{
            walletId: wallet._id,
            ...actorRef,
            type: 'withdraw',
            amount: -amount,
            description: `Rút tiền ra ${provider}`,
            status: 'pending',
            provider,
            metadata: { ownerType, actorId, phoneNumber },
          }],
          { session }
        );

        transactionResult = transactions[0];

        // 5. ✅ Atomic update: Trừ balance
        await this.walletModel.findByIdAndUpdate(
          wallet._id,
          {
            $inc: { 
              balance: -amount,
              totalWithdrawals: amount
            }
          },
          { session }
        );

        this.logger.log(`✅ Atomic withdraw created: transactionId=${transactionResult._id}, amount=${amount}`);
      });

      return transactionResult;
    } catch (error) {
      this.logger.error(`❌ Atomic withdraw failed: ${error.message}`, error.stack);
      throw error;
    } finally {
      await session.endSession();
    }
  }

  /**
   * Phân chia tiền từ đơn hàng
   * Khi đơn hàng hoàn thành → chia tiền cho nhà hàng, tài xế, platform
   */
  async distributeOrderEarnings(order: any) {
    console.log(`🔍 distributeOrderEarnings called with:`, {
      orderId: order._id,
      restaurantRevenue: order.restaurantRevenue,
      driverPayment: order.driverPayment,
      platformFeeAmount: order.platformFeeAmount
    });
    
    const results = [];

    // 1. Credit vào ví nhà hàng
    if (order.restaurantRevenue > 0) {
      const restaurantWallet = await this.getWalletForActor('restaurant', order.restaurantId.toString());
      
      // Tạo transaction
      const revenueTransaction = await this.walletTransactionModel.create({
        walletId: restaurantWallet._id,
        restaurantId: new Types.ObjectId(order.restaurantId),
        type: 'order_revenue',
        amount: order.restaurantRevenue,
        description: `Nhận tiền từ đơn hàng #${order.code}`,
        status: 'completed',
        orderId: new Types.ObjectId(order._id),
        orderCode: order.code,
        metadata: { orderId: order._id, ensureWallet: true },
      });

      // Credit vào ví
      await this.walletModel.findByIdAndUpdate(restaurantWallet._id, {
        $inc: { balance: order.restaurantRevenue }
      });

      results.push({ type: 'restaurant_revenue', transactionId: revenueTransaction._id });
    }

    // 2. Credit vào ví tài xế (commission)
    if (order.driverPayment > 0 && order.driverId) {
      const driverWallet = await this.getWalletForActor('driver', order.driverId.toString());
      
      const commissionTransaction = await this.walletTransactionModel.create({
        walletId: driverWallet._id,
        driverId: new Types.ObjectId(order.driverId),
        type: 'commission',
        amount: order.driverPayment,
        description: `Nhận tiền từ đơn hàng #${order.code}`,
        status: 'completed',
        orderId: new Types.ObjectId(order._id),
        orderCode: order.code,
        metadata: { orderId: order._id },
      });

      await this.walletModel.findByIdAndUpdate(driverWallet._id, {
        $inc: { balance: order.driverPayment }
      });

      results.push({ type: 'driver_commission', transactionId: commissionTransaction._id });
    }

    // 3. Chuyển tiền từ escrow platform sang balance và chia cho các bên
    const totalOrderAmount = order.restaurantRevenue + order.driverPayment + order.platformFeeAmount;
    console.log(`💰 Processing order settlement: ${totalOrderAmount} VND from platform escrow`);
    
    // Lấy system wallet
    const systemWallet = await this.getWalletForActor('admin', 'system');
    console.log(`📊 System wallet before settlement:`, {
      _id: systemWallet._id,
      balance: systemWallet.balance,
      escrowBalance: systemWallet.escrowBalance
    });

    // Kiểm tra escrow đủ không
    if (systemWallet.escrowBalance < totalOrderAmount) {
      throw new Error(`Insufficient escrow balance: ${systemWallet.escrowBalance} < ${totalOrderAmount}`);
    }

    // Chuyển tiền từ escrow sang balance
    await this.walletModel.findByIdAndUpdate(systemWallet._id, {
      $inc: { 
        escrowBalance: -totalOrderAmount,
        balance: order.platformFeeAmount  // Chỉ giữ lại platform fee
      }
    });

    // Tạo transaction cho platform fee
    if (order.platformFeeAmount > 0) {
      const platformTransaction = await this.walletTransactionModel.create({
        walletId: systemWallet._id,
        isSystemTransaction: true,
        type: 'platform_fee',
        amount: order.platformFeeAmount,
        description: `Phí platform từ đơn hàng #${order.code}`,
        status: 'completed',
        orderId: new Types.ObjectId(order._id),
        orderCode: order.code,
        metadata: { orderId: order._id },
      });

      results.push({ type: 'platform_fee', transactionId: platformTransaction._id });
    }

    // Verify update
    const updatedWallet = await this.walletModel.findById(systemWallet._id);
    console.log(`✅ System wallet after settlement:`, {
      balance: updatedWallet?.balance,
      escrowBalance: updatedWallet?.escrowBalance,
      platformFeeKept: order.platformFeeAmount
    });

    return results;
  }

  /**
   * Update transaction với provider payment URL
   */
  async updateTransactionProviderUrl(transactionId: string, paymentUrl: string) {
    await this.walletTransactionModel.findByIdAndUpdate(transactionId, {
      $set: { providerPaymentUrl: paymentUrl }
    });
  }

  /**
   * Lấy transaction theo ID
   */
  async getTransactionById(transactionId: string): Promise<WalletTransaction | null> {
    try {
      return await this.walletTransactionModel.findById(transactionId).exec();
    } catch (error) {
      this.logger.error(`❌ Error getting transaction ${transactionId}: ${error.message}`);
      return null;
    }
  }
}