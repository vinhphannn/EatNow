const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

async function testDistributeEarnings() {
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
    
    console.log('📦 Delivered order:', {
      id: deliveredOrder._id,
      code: deliveredOrder.code,
      status: deliveredOrder.status,
      finalTotal: deliveredOrder.finalTotal,
      subtotal: deliveredOrder.subtotal,
      deliveryFee: deliveredOrder.deliveryFee,
      tip: deliveredOrder.driverTip || deliveredOrder.tip || 0,
      restaurantId: deliveredOrder.restaurantId,
      driverId: deliveredOrder.driverId
    });
    
    // Kiểm tra platform wallet trước khi phân phối
    const platformWallet = await db.collection('wallets').findOne({
      ownerType: 'admin',
      isSystemWallet: true
    });
    
    if (!platformWallet) {
      console.log('❌ No platform wallet found');
      return;
    }
    
    console.log('💰 Platform wallet before distribution:', {
      balance: platformWallet.balance,
      escrowBalance: platformWallet.escrowBalance,
      totalDeposits: platformWallet.totalDeposits,
      totalWithdrawals: platformWallet.totalWithdrawals
    });
    
    // Kiểm tra restaurant wallet
    const restaurantWallet = await db.collection('wallets').findOne({
      ownerType: 'restaurant',
      restaurantId: deliveredOrder.restaurantId
    });
    
    if (restaurantWallet) {
      console.log('🏪 Restaurant wallet before distribution:', {
        balance: restaurantWallet.balance,
        totalDeposits: restaurantWallet.totalDeposits,
        totalWithdrawals: restaurantWallet.totalWithdrawals
      });
    }
    
    // Kiểm tra driver wallet
    const driverWallet = await db.collection('wallets').findOne({
      ownerType: 'driver',
      driverId: deliveredOrder.driverId
    });
    
    if (driverWallet) {
      console.log('🚗 Driver wallet before distribution:', {
        balance: driverWallet.balance,
        totalDeposits: driverWallet.totalDeposits,
        totalWithdrawals: driverWallet.totalWithdrawals
      });
    }
    
    // Tính toán phân phối tiền
    const subtotal = deliveredOrder.subtotal || 0;
    const deliveryFee = deliveredOrder.deliveryFee || 0;
    const tip = deliveredOrder.driverTip || deliveredOrder.tip || 0;
    const platformFeeRate = 10; // 10%
    const platformFeeAmount = Math.floor(subtotal * platformFeeRate / 100);
    const restaurantRevenue = subtotal - platformFeeAmount;
    const driverCommissionRate = 30; // 30%
    const driverCommissionAmount = Math.floor(deliveryFee * driverCommissionRate / 100);
    const driverPayment = deliveryFee + tip - driverCommissionAmount;
    
    console.log('\n🧮 Distribution calculation:');
    console.log('Subtotal:', subtotal);
    console.log('Platform fee (10%):', platformFeeAmount);
    console.log('Restaurant revenue:', restaurantRevenue);
    console.log('Delivery fee:', deliveryFee);
    console.log('Tip:', tip);
    console.log('Driver commission (30%):', driverCommissionAmount);
    console.log('Driver payment:', driverPayment);
    console.log('Total to distribute:', restaurantRevenue + driverPayment + platformFeeAmount);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

testDistributeEarnings();
