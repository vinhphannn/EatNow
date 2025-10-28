const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function createTestDriver() {
  const mongoUri = process.env.MONGODB_URI;
  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    const db = client.db('eatnow');
    
    // Tạo user cho driver
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const user = {
      email: 'driver@example.com',
      password: hashedPassword,
      role: 'driver',
      name: 'Test Driver',
      phone: '0123456789',
      isActive: true,
      createdAt: new Date()
    };
    
    // Kiểm tra xem user đã tồn tại chưa
    const existingUser = await db.collection('users').findOne({ email: 'driver@example.com' });
    if (existingUser) {
      console.log('👤 User already exists:', existingUser._id);
      
      // Tạo driver record
      const existingDriver = await db.collection('drivers').findOne({ userId: existingUser._id });
      if (existingDriver) {
        console.log('👤 Driver already exists:', existingDriver._id);
        return;
      }
      
      const driver = {
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
      
      const driverResult = await db.collection('drivers').insertOne(driver);
      console.log('✅ Driver created:', driverResult.insertedId);
      
      // Tạo ví cho driver
      const wallet = {
        ownerType: 'driver',
        driverId: driverResult.insertedId,
        balance: 200000, // 200k VND
        pendingBalance: 0,
        escrowBalance: 0,
        totalDeposits: 200000,
        totalWithdrawals: 0,
        isActive: true,
        createdAt: new Date()
      };
      
      const walletResult = await db.collection('wallets').insertOne(wallet);
      console.log('✅ Driver wallet created:', walletResult.insertedId);
      
    } else {
      const userResult = await db.collection('users').insertOne(user);
      console.log('✅ User created:', userResult.insertedId);
      
      // Tạo driver record
      const driver = {
        userId: userResult.insertedId,
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
      
      const driverResult = await db.collection('drivers').insertOne(driver);
      console.log('✅ Driver created:', driverResult.insertedId);
      
      // Tạo ví cho driver
      const wallet = {
        ownerType: 'driver',
        driverId: driverResult.insertedId,
        balance: 200000, // 200k VND
        pendingBalance: 0,
        escrowBalance: 0,
        totalDeposits: 200000,
        totalWithdrawals: 0,
        isActive: true,
        createdAt: new Date()
      };
      
      const walletResult = await db.collection('wallets').insertOne(wallet);
      console.log('✅ Driver wallet created:', walletResult.insertedId);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

createTestDriver();
