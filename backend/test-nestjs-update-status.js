const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

async function testNestjsUpdateStatus() {
  const mongoUri = process.env.MONGODB_URI;
  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    const db = client.db('eatnow');
    
    // Tìm đơn hàng picking_up
    const pickingUpOrder = await db.collection('orders').findOne({
      status: 'picking_up',
      driverId: { $exists: true, $ne: null }
    });
    
    if (!pickingUpOrder) {
      console.log('❌ No picking_up order found');
      return;
    }
    
    console.log('📦 Found picking_up order:', pickingUpOrder.code);
    
    // Kiểm tra platform wallet trước
    const platformWalletBefore = await db.collection('wallets').findOne({
      ownerType: 'admin',
      isSystemWallet: true
    });
    
    console.log('💰 Platform wallet before:', {
      balance: platformWalletBefore.balance,
      escrowBalance: platformWalletBefore.escrowBalance
    });
    
    // Kiểm tra restaurant wallet trước
    const restaurantWalletBefore = await db.collection('wallets').findOne({
      ownerType: 'restaurant',
      restaurantId: pickingUpOrder.restaurantId
    });
    
    console.log('🏪 Restaurant wallet before:', {
      balance: restaurantWalletBefore?.balance || 0
    });
    
    // Kiểm tra driver wallet trước
    const driverWalletBefore = await db.collection('wallets').findOne({
      ownerType: 'driver',
      driverId: pickingUpOrder.driverId
    });
    
    console.log('🚗 Driver wallet before:', {
      balance: driverWalletBefore?.balance || 0
    });
    
    // Cập nhật status thành delivered
    const updatedOrder = await db.collection('orders').findOneAndUpdate(
      { _id: pickingUpOrder._id },
      { 
        $set: { status: 'delivered' },
        $push: {
          trackingHistory: {
            status: 'delivered',
            timestamp: new Date(),
            note: 'Đơn hàng đã giao thành công',
            updatedBy: 'driver'
          }
        }
      },
      { returnDocument: 'after' }
    );
    
    console.log('✅ Order status updated to delivered');
    
    // Kiểm tra platform wallet sau
    const platformWalletAfter = await db.collection('wallets').findOne({
      ownerType: 'admin',
      isSystemWallet: true
    });
    
    console.log('💰 Platform wallet after:', {
      balance: platformWalletAfter.balance,
      escrowBalance: platformWalletAfter.escrowBalance
    });
    
    // Kiểm tra restaurant wallet sau
    const restaurantWalletAfter = await db.collection('wallets').findOne({
      ownerType: 'restaurant',
      restaurantId: pickingUpOrder.restaurantId
    });
    
    console.log('🏪 Restaurant wallet after:', {
      balance: restaurantWalletAfter?.balance || 0
    });
    
    // Kiểm tra driver wallet sau
    const driverWalletAfter = await db.collection('wallets').findOne({
      ownerType: 'driver',
      driverId: pickingUpOrder.driverId
    });
    
    console.log('🚗 Driver wallet after:', {
      balance: driverWalletAfter?.balance || 0
    });
    
    // Kiểm tra xem có thay đổi gì không
    const platformChanged = platformWalletAfter.balance !== platformWalletBefore.balance || 
                           platformWalletAfter.escrowBalance !== platformWalletBefore.escrowBalance;
    const restaurantChanged = (restaurantWalletAfter?.balance || 0) !== (restaurantWalletBefore?.balance || 0);
    const driverChanged = (driverWalletAfter?.balance || 0) !== (driverWalletBefore?.balance || 0);
    
    console.log('\n📊 Changes detected:');
    console.log('Platform wallet changed:', platformChanged);
    console.log('Restaurant wallet changed:', restaurantChanged);
    console.log('Driver wallet changed:', driverChanged);
    
    if (!platformChanged && !restaurantChanged && !driverChanged) {
      console.log('❌ No changes detected - distributeOrderEarnings was not called');
    } else {
      console.log('✅ Changes detected - distributeOrderEarnings was called');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

testNestjsUpdateStatus();
