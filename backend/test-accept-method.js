const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

async function testAcceptMethod() {
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
    
    // Test logic tìm driver bằng userId
    console.log('\n🔍 Testing driver lookup by userId...');
    const driverByUserId = await db.collection('drivers').findOne({ 
      userId: new ObjectId(driver.userId) 
    });
    
    if (!driverByUserId) {
      console.log('❌ Driver not found by userId:', driver.userId);
      return;
    }
    
    console.log('✅ Driver found by userId:', driverByUserId._id);
    
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
    
    // Test với driverId.toString()
    console.log('\n🔍 Testing with driverId.toString()...');
    const driverIdString = driverByUserId._id.toString();
    console.log('Driver ID string:', driverIdString);
    console.log('Is valid ObjectId:', ObjectId.isValid(driverIdString));
    
    // Test tìm ví với driverId string
    const driverWalletByString = await db.collection('wallets').findOne({
      ownerType: 'driver',
      driverId: new ObjectId(driverIdString),
      isActive: true
    });
    
    if (driverWalletByString) {
      console.log('✅ Wallet found with string ID:', driverWalletByString._id);
    } else {
      console.log('❌ No wallet found with string ID');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

testAcceptMethod();
