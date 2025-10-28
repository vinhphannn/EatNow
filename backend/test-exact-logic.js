const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

async function testExactLogic() {
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
      userIdType: typeof driver.userId,
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
    
    // Test logic tìm driver bằng userId (như trong acceptOrderByDriver)
    console.log('\n🔍 Testing driver lookup by userId (exact logic)...');
    console.log('Looking for driver with userId:', driver.userId);
    console.log('userId type:', typeof driver.userId);
    
    // Convert userId to ObjectId if it's a string
    const userIdObjectId = typeof driver.userId === 'string' 
      ? new ObjectId(driver.userId) 
      : driver.userId;
    
    console.log('userIdObjectId:', userIdObjectId);
    
    const driverByUserId = await db.collection('drivers').findOne({ 
      userId: userIdObjectId 
    });
    
    if (!driverByUserId) {
      console.log('❌ Driver not found by userId');
      return;
    }
    
    console.log('✅ Driver found by userId:', {
      id: driverByUserId._id,
      userId: driverByUserId.userId,
      name: driverByUserId.name
    });
    
    // Kiểm tra xem có phải cùng driver không
    if (driverByUserId._id.toString() !== driver._id.toString()) {
      console.log('❌ Different driver found!');
      console.log('Expected:', driver._id);
      console.log('Found:', driverByUserId._id);
      return;
    }
    
    console.log('✅ Same driver found');
    
    // Test logic tìm ví của driver
    console.log('\n🔍 Testing wallet lookup...');
    const driverWallet = await db.collection('wallets').findOne({
      ownerType: 'driver',
      driverId: driverByUserId._id,
      isActive: true
    });
    
    if (!driverWallet) {
      console.log('❌ No wallet found for driver');
      return;
    }
    
    console.log('✅ Driver wallet found:', {
      walletId: driverWallet._id,
      balance: driverWallet.balance,
      pendingBalance: driverWallet.pendingBalance,
      escrowBalance: driverWallet.escrowBalance
    });
    
    // Test logic kiểm tra thanh toán
    console.log('\n🔍 Testing payment check...');
    console.log('Driver balance:', driverWallet.balance);
    console.log('Order amount:', order.finalTotal);
    console.log('Can pay:', driverWallet.balance >= order.finalTotal);
    
    if (driverWallet.balance < order.finalTotal) {
      const need = order.finalTotal - driverWallet.balance;
      console.log('❌ Insufficient balance. Need:', need);
    } else {
      console.log('✅ Sufficient balance. Can accept order.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

testExactLogic();
