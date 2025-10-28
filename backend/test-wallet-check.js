const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

async function testWalletCheck() {
  const mongoUri = process.env.MONGODB_URI;
  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    const db = client.db('eatnow');
    
    // Lấy driver có ví với balance > 0
    const driverWithWallet = await db.collection('drivers').findOne({
      _id: new ObjectId('68e4efc87d83a75499133e17') // Driver có 200k balance
    });
    
    if (!driverWithWallet) {
      console.log('❌ No driver found');
      return;
    }
    
    console.log('👤 Driver:', {
      id: driverWithWallet._id,
      name: driverWithWallet.name,
      userId: driverWithWallet.userId
    });
    
    // Tìm ví của driver
    const wallet = await db.collection('wallets').findOne({
      ownerType: 'driver',
      driverId: driverWithWallet._id,
      isActive: true
    });
    
    if (!wallet) {
      console.log('❌ No wallet found for driver');
      return;
    }
    
    console.log('💰 Driver wallet:', {
      walletId: wallet._id,
      balance: wallet.balance,
      pendingBalance: wallet.pendingBalance,
      escrowBalance: wallet.escrowBalance
    });
    
    // Tìm đơn hàng tiền mặt
    const cashOrder = await db.collection('orders').findOne({
      paymentMethod: 'cash',
      status: { $nin: ['delivered', 'cancelled'] },
      driverId: { $exists: false }
    });
    
    if (!cashOrder) {
      console.log('❌ No cash order found');
      return;
    }
    
    console.log('📦 Cash order:', {
      id: cashOrder._id,
      finalTotal: cashOrder.finalTotal,
      paymentMethod: cashOrder.paymentMethod,
      status: cashOrder.status
    });
    
    // Kiểm tra logic
    const canPay = wallet.balance >= cashOrder.finalTotal;
    console.log('🔍 Payment check:', {
      driverBalance: wallet.balance,
      orderAmount: cashOrder.finalTotal,
      canPay: canPay,
      need: canPay ? 0 : cashOrder.finalTotal - wallet.balance
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

testWalletCheck();
