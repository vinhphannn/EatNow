const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

async function distributeAllDeliveredOrders() {
  const mongoUri = process.env.MONGODB_URI;
  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    const db = client.db('eatnow');
    
    // Tìm tất cả đơn hàng đã delivered
    const deliveredOrders = await db.collection('orders').find({
      status: 'delivered',
      driverId: { $exists: true, $ne: null }
    }).toArray();
    
    console.log('📦 Found delivered orders:', deliveredOrders.length);
    
    if (deliveredOrders.length === 0) {
      console.log('❌ No delivered orders found');
      return;
    }
    
    // Kiểm tra platform wallet trước
    const platformWalletBefore = await db.collection('wallets').findOne({
      ownerType: 'admin',
      isSystemWallet: true
    });
    
    console.log('💰 Platform wallet before:', {
      balance: platformWalletBefore.balance,
      escrowBalance: platformWalletBefore.escrowBalance
    });
    
    let totalDistributed = 0;
    
    for (const order of deliveredOrders) {
      console.log(`\n📦 Processing order: ${order.code}`);
      
      // Tính toán phân phối tiền
      const subtotal = order.subtotal || 0;
      const deliveryFee = order.deliveryFee || 0;
      const tip = order.driverTip || order.tip || 0;
      const doorFee = order.doorFee || 0;
      
      // Platform fee rate và amount (từ order schema)
      const platformFeeRate = order.platformFeeRate || 10; // Default 10%
      const platformFeeAmount = order.platformFeeAmount || Math.floor(subtotal * platformFeeRate / 100);
      
      // Driver commission rate
      const driverCommissionRate = order.driverCommissionRate || 30; // Default 30%
      const driverCommissionAmount = Math.floor((deliveryFee + doorFee) * driverCommissionRate / 100);
      
      // Tính toán tiền phân chia
      // Restaurant: subtotal - platformFee
      const restaurantRevenue = subtotal - platformFeeAmount;
      
      // Driver: deliveryFee + tip + doorFee - driverCommission
      const driverPayment = deliveryFee + tip + doorFee - driverCommissionAmount;
      
      // Platform thu: platformFee + driverCommission
      const platformTotalFee = platformFeeAmount + driverCommissionAmount;
      
      console.log('🧮 Distribution calculation:');
      console.log('Subtotal:', subtotal);
      console.log('Delivery fee:', deliveryFee);
      console.log('Door fee:', doorFee);
      console.log('Tip:', tip);
      console.log('Platform fee (10%):', platformFeeAmount);
      console.log('Driver commission (30%):', driverCommissionAmount);
      console.log('Restaurant revenue:', restaurantRevenue);
      console.log('Driver payment:', driverPayment);
      console.log('Platform total fee:', platformTotalFee);
      
      // 1. Credit vào ví nhà hàng
      if (restaurantRevenue > 0) {
        let restaurantWallet = await db.collection('wallets').findOne({
          ownerType: 'restaurant',
          restaurantId: order.restaurantId
        });
        
        if (!restaurantWallet) {
          // Tạo ví cho nhà hàng
          restaurantWallet = await db.collection('wallets').insertOne({
            ownerType: 'restaurant',
            restaurantId: order.restaurantId,
            balance: 0,
            pendingBalance: 0,
            escrowBalance: 0,
            totalDeposits: 0,
            totalWithdrawals: 0,
            isActive: true,
            createdAt: new Date()
          });
          restaurantWallet = { _id: restaurantWallet.insertedId, balance: 0 };
          console.log('✅ Created restaurant wallet');
        }
        
        // Tạo transaction
        const revenueTransaction = await db.collection('wallettransactions').insertOne({
          walletId: restaurantWallet._id,
          restaurantId: order.restaurantId,
          type: 'order_revenue',
          amount: restaurantRevenue,
          description: `Nhận tiền từ đơn hàng #${order.code}`,
          status: 'completed',
          orderId: order._id,
          orderCode: order.code,
          metadata: { orderId: order._id, ensureWallet: true },
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
      
      // 2. Credit vào ví tài xế
      if (driverPayment > 0 && order.driverId) {
        let driverWallet = await db.collection('wallets').findOne({
          ownerType: 'driver',
          driverId: order.driverId
        });
        
        if (!driverWallet) {
          // Tạo ví cho tài xế
          driverWallet = await db.collection('wallets').insertOne({
            ownerType: 'driver',
            driverId: order.driverId,
            balance: 0,
            pendingBalance: 0,
            escrowBalance: 0,
            totalDeposits: 0,
            totalWithdrawals: 0,
            isActive: true,
            createdAt: new Date()
          });
          driverWallet = { _id: driverWallet.insertedId, balance: 0 };
          console.log('✅ Created driver wallet');
        }
        
        const commissionTransaction = await db.collection('wallettransactions').insertOne({
          walletId: driverWallet._id,
          driverId: order.driverId,
          type: 'commission',
          amount: driverPayment,
          description: `Nhận tiền từ đơn hàng #${order.code}`,
          status: 'completed',
          orderId: order._id,
          orderCode: order.code,
          metadata: { orderId: order._id },
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        await db.collection('wallets').updateOne(
          { _id: driverWallet._id },
          { $inc: { balance: driverPayment } }
        );
        
        console.log('✅ Driver credited:', driverPayment, 'VND');
      }
      
      // 3. Chuyển tiền từ escrow platform sang balance
      const totalOrderAmount = restaurantRevenue + driverPayment + platformTotalFee;
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
              balance: platformTotalFee
            }
          }
        );
        
        // Tạo transaction cho platform fee (10% từ subtotal)
        if (platformFeeAmount > 0) {
          await db.collection('wallettransactions').insertOne({
            walletId: platformWallet._id,
            isSystemTransaction: true,
            type: 'platform_fee',
            amount: platformFeeAmount,
            description: `Phí platform (10%) từ đơn hàng #${order.code}`,
            status: 'completed',
            orderId: order._id,
            orderCode: order.code,
            metadata: { orderId: order._id },
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
        
        // Tạo transaction cho driver commission (30% từ deliveryFee)
        if (driverCommissionAmount > 0) {
          await db.collection('wallettransactions').insertOne({
            walletId: platformWallet._id,
            isSystemTransaction: true,
            type: 'driver_commission',
            amount: driverCommissionAmount,
            description: `Phí chiết khấu tài xế (30%) từ đơn hàng #${order.code}`,
            status: 'completed',
            orderId: order._id,
            orderCode: order.code,
            metadata: { orderId: order._id },
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
        
        console.log('✅ Platform total fee processed:', platformTotalFee, 'VND');
        console.log('  - Platform fee (10%):', platformFeeAmount, 'VND');
        console.log('  - Driver commission (30%):', driverCommissionAmount, 'VND');
      }
      
      totalDistributed += totalOrderAmount;
    }
    
    // Kiểm tra kết quả cuối cùng
    console.log('\n📊 Final results:');
    
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
    
    // Tổng kết
    console.log('\n🎉 Distribution completed:');
    console.log('Total orders processed:', deliveredOrders.length);
    console.log('Total amount distributed:', totalDistributed, 'VND');
    console.log('Platform escrow reduced by:', platformWalletBefore.escrowBalance - updatedPlatformWallet.escrowBalance, 'VND');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

distributeAllDeliveredOrders();
