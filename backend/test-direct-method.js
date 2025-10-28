const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

async function testDirectMethod() {
  const mongoUri = process.env.MONGODB_URI;
  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    const db = client.db('eatnow');
    
    // Lấy driver có ví với balance > 0
    const driver = await db.collection('drivers').findOne({
      _id: new ObjectId('68e4efc47d83a75499133e12') // Driver có 80k balance
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
    
    // Test logic tìm driver (như trong acceptOrderByDriver)
    console.log('\n🔍 Testing driver lookup logic...');
    const drivers = await db.collection('drivers').find({ 
      $or: [
        { userId: new ObjectId(driver.userId) },
        { userId: driver.userId }
      ]
    }).toArray();
    
    console.log('Found drivers:', drivers.length);
    
    // Tìm driver có ví với balance > 0
    let selectedDriver = null;
    for (const d of drivers) {
      const wallet = await db.collection('wallets').findOne({
        ownerType: 'driver',
        driverId: d._id,
        isActive: true
      });
      
      console.log(`Driver ${d._id} wallet:`, {
        found: !!wallet,
        balance: wallet?.balance || 0
      });
      
      if (wallet && wallet.balance > 0) {
        selectedDriver = d;
        console.log(`✅ Selected driver with balance > 0: ${d._id}`);
        break;
      }
    }
    
    if (!selectedDriver) {
      selectedDriver = drivers[0];
      console.log(`⚠️ No driver with balance > 0, using first driver: ${selectedDriver._id}`);
    }
    
    console.log('\n🎯 Selected driver:', {
      id: selectedDriver._id,
      userId: selectedDriver.userId
    });
    
    // Test logic kiểm tra thanh toán
    console.log('\n🔍 Testing payment check...');
    const driverWallet = await db.collection('wallets').findOne({
      ownerType: 'driver',
      driverId: selectedDriver._id,
      isActive: true
    });
    
    if (!driverWallet) {
      console.log('❌ No wallet found for selected driver');
      return;
    }
    
    console.log('Driver wallet:', {
      balance: driverWallet.balance,
      pendingBalance: driverWallet.pendingBalance,
      escrowBalance: driverWallet.escrowBalance
    });
    
    console.log('Order amount:', order.finalTotal);
    console.log('Can pay:', driverWallet.balance >= order.finalTotal);
    
    if (driverWallet.balance < order.finalTotal) {
      const need = order.finalTotal - driverWallet.balance;
      console.log('❌ Insufficient balance. Need:', need);
    } else {
      console.log('✅ Sufficient balance. Can accept order.');
      
      // Simulate payment process
      console.log('\n🔄 Simulating payment process...');
      
      // 1. Trừ tiền từ ví driver
      const newDriverBalance = driverWallet.balance - order.finalTotal;
      console.log('New driver balance:', newDriverBalance);
      
      // 2. Tăng escrowBalance của platform
      const platformWallet = await db.collection('wallets').findOne({
        ownerType: 'admin',
        isSystemWallet: true
      });
      
      if (platformWallet) {
        const newEscrowBalance = platformWallet.escrowBalance + order.finalTotal;
        console.log('New platform escrow balance:', newEscrowBalance);
        
        // 3. Cập nhật order với driverId
        console.log('Updating order with driverId:', selectedDriver._id);
        
        // 4. Cập nhật driver status
        console.log('Updating driver status to delivering');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

testDirectMethod();
