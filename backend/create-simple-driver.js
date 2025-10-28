const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

async function createSimpleDriver() {
  const mongoUri = process.env.MONGODB_URI;
  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    const db = client.db('eatnow');
    
    // Tìm user driver đã có
    const existingUser = await db.collection('users').findOne({ 
      email: 'driver@example.com',
      role: 'driver' 
    });
    
    if (!existingUser) {
      console.log('❌ No driver user found. Please create driver user first.');
      return;
    }
    
    console.log('👤 Found driver user:', existingUser._id);
    
    // Tìm driver record
    let driver = await db.collection('drivers').findOne({ userId: existingUser._id });
    
    if (!driver) {
      // Tạo driver record
      const driverData = {
        userId: existingUser._id,
        name: 'Test Driver',
        phone: '0123456789',
        status: 'checkin',
        deliveryStatus: null,
        currentOrderId: null,
        activeOrdersCount: 0,
        rating: 5.0,
        totalOrders: 0,
        createdAt: new Date()
      };
      
      const driverResult = await db.collection('drivers').insertOne(driverData);
      driver = { _id: driverResult.insertedId, ...driverData };
      console.log('✅ Driver created:', driver._id);
    } else {
      console.log('👤 Driver already exists:', driver._id);
    }
    
    // Tìm ví của driver
    let wallet = await db.collection('wallets').findOne({
      ownerType: 'driver',
      driverId: driver._id,
      isActive: true
    });
    
    if (!wallet) {
      // Tạo ví cho driver
      const walletData = {
        ownerType: 'driver',
        driverId: driver._id,
        balance: 200000, // 200k VND
        pendingBalance: 0,
        escrowBalance: 0,
        totalDeposits: 200000,
        totalWithdrawals: 0,
        isActive: true,
        createdAt: new Date()
      };
      
      const walletResult = await db.collection('wallets').insertOne(walletData);
      wallet = { _id: walletResult.insertedId, ...walletData };
      console.log('✅ Driver wallet created:', wallet._id);
    } else {
      console.log('💰 Driver wallet already exists:', wallet._id);
      console.log('💰 Wallet balance:', wallet.balance);
    }
    
    console.log('\n📋 Test driver info:');
    console.log('👤 User ID:', existingUser._id);
    console.log('👤 Driver ID:', driver._id);
    console.log('💰 Wallet ID:', wallet._id);
    console.log('💰 Balance:', wallet.balance);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

createSimpleDriver();
