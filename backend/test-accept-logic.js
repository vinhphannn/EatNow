const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

async function testAcceptLogic() {
  const mongoUri = process.env.MONGODB_URI;
  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    const db = client.db('eatnow');
    
    // Lấy driver có ví với balance > 0
    const driver = await db.collection('drivers').findOne({
      _id: new ObjectId('68e4efc87d83a75499133e17') // Driver có 200k balance
    });
    
    if (!driver) {
      console.log('❌ No driver found');
      return;
    }
    
    console.log('👤 Driver:', {
      id: driver._id,
      userId: driver.userId,
      name: driver.name
    });
    
    // Lấy đơn hàng tiền mặt
    const order = await db.collection('orders').findOne({
      paymentMethod: 'cash',
      status: { $nin: ['delivered', 'cancelled'] },
      driverId: { $exists: false }
    });
    
    if (!order) {
      console.log('❌ No cash order found');
      return;
    }
    
    console.log('📦 Order:', {
      id: order._id,
      finalTotal: order.finalTotal,
      paymentMethod: order.paymentMethod,
      status: order.status
    });
    
    // Tìm ví của driver
    const driverWallet = await db.collection('wallets').findOne({
      ownerType: 'driver',
      driverId: driver._id,
      isActive: true
    });
    
    if (!driverWallet) {
      console.log('❌ No wallet found for driver');
      return;
    }
    
    console.log('💰 Driver wallet:', {
      walletId: driverWallet._id,
      balance: driverWallet.balance,
      pendingBalance: driverWallet.pendingBalance,
      escrowBalance: driverWallet.escrowBalance
    });
    
    // Kiểm tra logic thanh toán
    console.log('\n🔍 Payment logic check:');
    console.log('Driver balance:', driverWallet.balance);
    console.log('Order amount:', order.finalTotal);
    console.log('Can pay:', driverWallet.balance >= order.finalTotal);
    
    if (driverWallet.balance < order.finalTotal) {
      const need = order.finalTotal - driverWallet.balance;
      console.log('❌ Insufficient balance. Need:', need);
    } else {
      console.log('✅ Sufficient balance. Can accept order.');
      
      // Simulate the payment process
      console.log('\n🔄 Simulating payment process...');
      
      // 1. Trừ tiền từ ví driver
      const newBalance = driverWallet.balance - order.finalTotal;
      console.log('New driver balance:', newBalance);
      
      // 2. Tăng escrowBalance của platform
      const platformWallet = await db.collection('wallets').findOne({
        ownerType: 'admin',
        isSystemWallet: true
      });
      
      if (platformWallet) {
        console.log('Platform wallet before:', {
          balance: platformWallet.balance,
          escrowBalance: platformWallet.escrowBalance
        });
        
        const newEscrowBalance = platformWallet.escrowBalance + order.finalTotal;
        console.log('New platform escrow balance:', newEscrowBalance);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

testAcceptLogic();
