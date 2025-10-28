const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

async function testUpdateStatus() {
  const mongoUri = process.env.MONGODB_URI;
  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    const db = client.db('eatnow');
    
    // Tìm đơn hàng đã delivered
    const deliveredOrder = await db.collection('orders').findOne({
      status: 'delivered',
      driverId: { $exists: true, $ne: null }
    });
    
    if (!deliveredOrder) {
      console.log('❌ No delivered order found');
      return;
    }
    
    console.log('📦 Found delivered order:', deliveredOrder.code);
    
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
      restaurantId: deliveredOrder.restaurantId
    });
    
    console.log('🏪 Restaurant wallet before:', {
      balance: restaurantWalletBefore.balance
    });
    
    // Kiểm tra driver wallet trước
    const driverWalletBefore = await db.collection('wallets').findOne({
      ownerType: 'driver',
      driverId: deliveredOrder.driverId
    });
    
    console.log('🚗 Driver wallet before:', {
      balance: driverWalletBefore.balance
    });
    
    // Tạo một đơn hàng mới để test
    const testOrder = await db.collection('orders').insertOne({
      customerId: deliveredOrder.customerId,
      restaurantId: deliveredOrder.restaurantId,
      driverId: deliveredOrder.driverId,
      items: deliveredOrder.items,
      subtotal: 20000,
      deliveryFee: 10000,
      tip: 0,
      finalTotal: 30000,
      paymentMethod: 'cash',
      status: 'picking_up',
      deliveryAddress: deliveredOrder.deliveryAddress,
      code: `TEST${Date.now()}`,
      createdAt: new Date(),
      trackingHistory: [{
        status: 'picking_up',
        timestamp: new Date(),
        note: 'Tài xế đang đến lấy hàng',
        updatedBy: 'driver'
      }]
    });
    
    console.log('📦 Created test order:', testOrder.insertedId);
    
    // Cập nhật status thành delivered
    const updatedOrder = await db.collection('orders').findOneAndUpdate(
      { _id: testOrder.insertedId },
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
      restaurantId: deliveredOrder.restaurantId
    });
    
    console.log('🏪 Restaurant wallet after:', {
      balance: restaurantWalletAfter.balance
    });
    
    // Kiểm tra driver wallet sau
    const driverWalletAfter = await db.collection('wallets').findOne({
      ownerType: 'driver',
      driverId: deliveredOrder.driverId
    });
    
    console.log('🚗 Driver wallet after:', {
      balance: driverWalletAfter.balance
    });
    
    // Xóa test order
    await db.collection('orders').deleteOne({ _id: testOrder.insertedId });
    console.log('🗑️ Test order deleted');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

testUpdateStatus();
