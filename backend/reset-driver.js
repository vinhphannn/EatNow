const mongoose = require('mongoose');
const redis = require('redis');

const uri = 'mongodb+srv://infovinhphan_db_user:dE1Arv8M7IhQBdkH@cluster0.qwdcq4j.mongodb.net/eatnow?retryWrites=true&w=majority&appName=Cluster0';

async function resetDriver() {
  try {
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');
    
    const redisClient = redis.createClient({ url: 'redis://localhost:6379' });
    await redisClient.connect();
    console.log('✅ Connected to Redis');
    
    const driverId = '68e4efc87d83a75499133e17';
    
    // Reset driver in MongoDB
    const driverSchema = new mongoose.Schema({
      deliveryStatus: String,
      currentOrderId: mongoose.Schema.Types.ObjectId,
      activeOrdersCount: Number
    }, { collection: 'drivers' });
    
    const Driver = mongoose.model('DriverTest', driverSchema);
    await Driver.findByIdAndUpdate(driverId, {
      deliveryStatus: null,
      currentOrderId: null,
      $inc: { activeOrdersCount: -1 }
    });
    
    // Add back to available drivers
    await redisClient.sAdd('available_drivers', driverId);
    
    console.log('✅ Driver reset to available');
    
    // Verify
    const availableDrivers = await redisClient.sMembers('available_drivers');
    console.log('🚗 Available drivers:', availableDrivers.length);
    
    await redisClient.disconnect();
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

resetDriver();
