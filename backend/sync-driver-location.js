const mongoose = require('mongoose');
const redis = require('redis');

const uri = 'mongodb+srv://infovinhphan_db_user:dE1Arv8M7IhQBdkH@cluster0.qwdcq4j.mongodb.net/eatnow?retryWrites=true&w=majority&appName=Cluster0';

async function syncDriverLocation() {
  try {
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');
    
    const redisClient = redis.createClient({ url: 'redis://localhost:6379' });
    await redisClient.connect();
    console.log('✅ Connected to Redis');
    
    const driverId = '68e4efc87d83a75499133e17';
    
    const driverSchema = new mongoose.Schema({
      status: String,
      deliveryStatus: String,
      currentOrderId: mongoose.Schema.Types.ObjectId,
      location: [Number],
      rating: Number,
      activeOrdersCount: Number,
      maxConcurrentOrders: Number
    }, { collection: 'drivers' });
    
    const Driver = mongoose.model('DriverCheck', driverSchema);
    const driver = await Driver.findById(driverId).lean();
    
    if (driver && driver.location && driver.location.length === 2) {
      const [lng, lat] = driver.location;
      
      // Sync to Redis using hSet with proper format
      await redisClient.hSet(`driver_location:${driverId}`, 'lat', lat.toString());
      await redisClient.hSet(`driver_location:${driverId}`, 'lng', lng.toString());
      await redisClient.hSet(`driver_location:${driverId}`, 'updatedAt', new Date().toISOString());
      
      console.log('✅ Synced driver location to Redis:', lat, lng);
      
      // Verify it was saved
      const savedLocation = await redisClient.hGetAll(`driver_location:${driverId}`);
      console.log('📍 Saved location:', savedLocation);
      
    } else {
      console.log('❌ Driver has no valid location');
    }
    
    await redisClient.disconnect();
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

syncDriverLocation();
