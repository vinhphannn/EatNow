const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

async function testNewLogic() {
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
    
    // Test logic mới: tìm tất cả driver với userId (cả ObjectId và string)
    console.log('\n🔍 Testing new driver lookup logic...');
    const drivers = await db.collection('drivers').find({ 
      $or: [
        { userId: new ObjectId(driver.userId) },
        { userId: driver.userId }
      ]
    }).toArray();
    
    console.log('Found drivers with userId:', drivers.length);
    drivers.forEach((d, index) => {
      console.log(`Driver ${index}:`, {
        id: d._id,
        userId: d.userId,
        userIdType: typeof d.userId
      });
    });
    
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
        balance: wallet?.balance || 0,
        pendingBalance: wallet?.pendingBalance || 0,
        escrowBalance: wallet?.escrowBalance || 0
      });
      
      if (wallet && wallet.balance > 0) {
        selectedDriver = d;
        console.log(`✅ Selected driver with balance > 0: ${d._id}`);
        break;
      }
    }
    
    if (!selectedDriver) {
      // Nếu không tìm thấy driver có ví với balance > 0, lấy driver đầu tiên
      selectedDriver = drivers[0];
      console.log(`⚠️ No driver with balance > 0, using first driver: ${selectedDriver._id}`);
    }
    
    console.log('\n🎯 Final selected driver:', {
      id: selectedDriver._id,
      userId: selectedDriver.userId,
      name: selectedDriver.name
    });
    
    // Kiểm tra ví của driver được chọn
    const selectedWallet = await db.collection('wallets').findOne({
      ownerType: 'driver',
      driverId: selectedDriver._id,
      isActive: true
    });
    
    if (!selectedWallet) {
      console.log('❌ No wallet found for selected driver');
      return;
    }
    
    console.log('💰 Selected driver wallet:', {
      walletId: selectedWallet._id,
      balance: selectedWallet.balance,
      pendingBalance: selectedWallet.pendingBalance,
      escrowBalance: selectedWallet.escrowBalance
    });
    
    // Test logic kiểm tra thanh toán
    console.log('\n🔍 Testing payment check...');
    console.log('Driver balance:', selectedWallet.balance);
    console.log('Order amount:', order.finalTotal);
    console.log('Can pay:', selectedWallet.balance >= order.finalTotal);
    
    if (selectedWallet.balance < order.finalTotal) {
      const need = order.finalTotal - selectedWallet.balance;
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

testNewLogic();
