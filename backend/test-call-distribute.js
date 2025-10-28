const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

async function testCallDistribute() {
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
    
    console.log('📦 Processing order:', deliveredOrder.code);
    
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
    
    console.log('🧮 Distribution calculation:');
    console.log('Restaurant revenue:', restaurantRevenue);
    console.log('Driver payment:', driverPayment);
    console.log('Platform fee:', platformFeeAmount);
    
    // Tạo order object như trong distributeOrderEarnings
    const orderData = {
      _id: deliveredOrder._id,
      restaurantId: deliveredOrder.restaurantId,
      driverId: deliveredOrder.driverId,
      code: deliveredOrder.code,
      restaurantRevenue,
      driverPayment,
      platformFeeAmount
    };
    
    console.log('📋 Order data for distribution:', orderData);
    
    // Kiểm tra platform wallet trước
    const platformWalletBefore = await db.collection('wallets').findOne({
      ownerType: 'admin',
      isSystemWallet: true
    });
    
    console.log('💰 Platform wallet before:', {
      balance: platformWalletBefore.balance,
      escrowBalance: platformWalletBefore.escrowBalance
    });
    
    // 1. Credit vào ví nhà hàng
    if (restaurantRevenue > 0) {
      const restaurantWallet = await db.collection('wallets').findOne({
        ownerType: 'restaurant',
        restaurantId: deliveredOrder.restaurantId
      });
      
      if (restaurantWallet) {
        // Tạo transaction
        const revenueTransaction = await db.collection('wallettransactions').insertOne({
          walletId: restaurantWallet._id,
          restaurantId: deliveredOrder.restaurantId,
          type: 'order_revenue',
          amount: restaurantRevenue,
          description: `Nhận tiền từ đơn hàng #${deliveredOrder.code}`,
          status: 'completed',
          orderId: deliveredOrder._id,
          orderCode: deliveredOrder.code,
          metadata: { orderId: deliveredOrder._id, ensureWallet: true },
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        // Credit vào ví
        await db.collection('wallets').updateOne(
          { _id: restaurantWallet._id },
          { $inc: { balance: restaurantRevenue } }
        );
        
        console.log('✅ Restaurant credited:', restaurantRevenue, 'VND');
      }
    }
    
    // 2. Credit vào ví tài xế
    if (driverPayment > 0 && deliveredOrder.driverId) {
      const driverWallet = await db.collection('wallets').findOne({
        ownerType: 'driver',
        driverId: deliveredOrder.driverId
      });
      
      if (driverWallet) {
        const commissionTransaction = await db.collection('wallettransactions').insertOne({
          walletId: driverWallet._id,
          driverId: deliveredOrder.driverId,
          type: 'commission',
          amount: driverPayment,
          description: `Nhận tiền từ đơn hàng #${deliveredOrder.code}`,
          status: 'completed',
          orderId: deliveredOrder._id,
          orderCode: deliveredOrder.code,
          metadata: { orderId: deliveredOrder._id },
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        await db.collection('wallets').updateOne(
          { _id: driverWallet._id },
          { $inc: { balance: driverPayment } }
        );
        
        console.log('✅ Driver credited:', driverPayment, 'VND');
      }
    }
    
    // 3. Chuyển tiền từ escrow platform sang balance
    const totalOrderAmount = restaurantRevenue + driverPayment + platformFeeAmount;
    const platformWallet = await db.collection('wallets').findOne({
      ownerType: 'admin',
      isSystemWallet: true
    });
    
    if (platformWallet) {
      // Chuyển tiền từ escrow sang balance
      await db.collection('wallets').updateOne(
        { _id: platformWallet._id },
        { 
          $inc: { 
            escrowBalance: -totalOrderAmount,
            balance: platformFeeAmount
          }
        }
      );
      
      // Tạo transaction cho platform fee
      if (platformFeeAmount > 0) {
        await db.collection('wallettransactions').insertOne({
          walletId: platformWallet._id,
          isSystemTransaction: true,
          type: 'platform_fee',
          amount: platformFeeAmount,
          description: `Phí platform từ đơn hàng #${deliveredOrder.code}`,
          status: 'completed',
          orderId: deliveredOrder._id,
          orderCode: deliveredOrder.code,
          metadata: { orderId: deliveredOrder._id },
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      
      console.log('✅ Platform fee processed:', platformFeeAmount, 'VND');
    }
    
    // Kiểm tra kết quả
    console.log('\n📊 After distribution:');
    
    const updatedPlatformWallet = await db.collection('wallets').findOne({
      ownerType: 'admin',
      isSystemWallet: true
    });
    
    if (updatedPlatformWallet) {
      console.log('💰 Platform wallet:', {
        balance: updatedPlatformWallet.balance,
        escrowBalance: updatedPlatformWallet.escrowBalance
      });
    }
    
    const updatedRestaurantWallet = await db.collection('wallets').findOne({
      ownerType: 'restaurant',
      restaurantId: deliveredOrder.restaurantId
    });
    
    if (updatedRestaurantWallet) {
      console.log('🏪 Restaurant wallet:', {
        balance: updatedRestaurantWallet.balance
      });
    }
    
    const updatedDriverWallet = await db.collection('wallets').findOne({
      ownerType: 'driver',
      driverId: deliveredOrder.driverId
    });
    
    if (updatedDriverWallet) {
      console.log('🚗 Driver wallet:', {
        balance: updatedDriverWallet.balance
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

testCallDistribute();
