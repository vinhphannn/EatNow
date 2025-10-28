const mongoose = require('mongoose');
require('dotenv').config();

// Kết nối MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eatnow');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
}

// Schema cho WalletTransaction
const walletTransactionSchema = new mongoose.Schema({
  walletId: { type: mongoose.Schema.Types.ObjectId, ref: 'Wallet' },
  type: { type: String, required: true },
  amount: { type: Number, required: true },
  description: String,
  status: { type: String, default: 'pending' },
  providerTransactionId: String,
  providerPaymentUrl: String,
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  orderCode: String,
  metadata: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const WalletTransaction = mongoose.model('WalletTransaction', walletTransactionSchema);

// Schema cho Wallet
const walletSchema = new mongoose.Schema({
  ownerType: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' },
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  balance: { type: Number, default: 0 },
  pendingBalance: { type: Number, default: 0 },
  escrowBalance: { type: Number, default: 0 },
  totalDeposits: { type: Number, default: 0 },
  totalWithdrawals: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  isSystemWallet: { type: Boolean, default: false }
});

const Wallet = mongoose.model('Wallet', walletSchema);

async function manualConfirmPendingDeposits() {
  try {
    await connectDB();

    // Tìm tất cả giao dịch deposit pending
    const pendingDeposits = await WalletTransaction.find({
      type: 'deposit',
      status: 'pending'
    }).populate('walletId');

    console.log(`🔍 Found ${pendingDeposits.length} pending deposits`);

    if (pendingDeposits.length === 0) {
      console.log('✅ No pending deposits found');
      return;
    }

    // Hiển thị danh sách
    console.log('\n📋 Pending deposits:');
    pendingDeposits.forEach((tx, index) => {
      console.log(`${index + 1}. ID: ${tx._id}`);
      console.log(`   Amount: ${tx.amount.toLocaleString()} VND`);
      console.log(`   Description: ${tx.description}`);
      console.log(`   Created: ${tx.createdAt}`);
      console.log(`   Wallet: ${tx.walletId?.ownerType} - ${tx.walletId?.userId || tx.walletId?.restaurantId || tx.walletId?.driverId}`);
      console.log('---');
    });

    // Confirm tất cả
    console.log('\n🔄 Confirming all pending deposits...');
    
    for (const tx of pendingDeposits) {
      try {
        // Tạo session cho transaction
        const session = await mongoose.startSession();
        
        await session.withTransaction(async () => {
          // Update transaction status
          await WalletTransaction.findByIdAndUpdate(tx._id, {
            status: 'completed',
            providerTransactionId: `manual_${tx._id}_${Date.now()}`,
            updatedAt: new Date()
          }).session(session);

          // Move từ pendingBalance sang balance
          await Wallet.findByIdAndUpdate(tx.walletId._id, {
            $inc: { 
              pendingBalance: -tx.amount,
              balance: tx.amount,
              totalDeposits: tx.amount
            }
          }).session(session);
        });

        await session.endSession();
        
        console.log(`✅ Confirmed: ${tx._id} (${tx.amount.toLocaleString()} VND)`);
        
      } catch (error) {
        console.error(`❌ Failed to confirm ${tx._id}: ${error.message}`);
      }
    }

    console.log('\n🎉 Manual confirmation completed!');
    
    // Hiển thị kết quả cuối
    const remainingPending = await WalletTransaction.countDocuments({
      type: 'deposit',
      status: 'pending'
    });
    
    console.log(`📊 Remaining pending deposits: ${remainingPending}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

// Chạy script
manualConfirmPendingDeposits();
