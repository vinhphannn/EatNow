const mongoose = require('mongoose');
const redis = require('redis');

const uri = 'mongodb+srv://infovinhphan_db_user:dE1Arv8M7IhQBdkH@cluster0.qwdcq4j.mongodb.net/eatnow?retryWrites=true&w=majority&appName=Cluster0';

async function checkOrderCoordinates() {
  try {
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');
    
    const redisClient = redis.createClient({ url: 'redis://localhost:6379' });
    await redisClient.connect();
    console.log('✅ Connected to Redis');
    
    // Check orders with coordinates
    const orderSchema = new mongoose.Schema({
      restaurantCoordinates: {
        latitude: Number,
        longitude: Number
      }
    }, { collection: 'orders' });
    
    const Order = mongoose.model('OrderTest', orderSchema);
    
    const ordersWithCoords = await Order.find({
      restaurantCoordinates: { $exists: true }
    }).limit(5).lean();
    
    console.log('📦 Orders with coordinates:', ordersWithCoords.length);
    
    if (ordersWithCoords.length > 0) {
      console.log('📍 First order coordinates:', ordersWithCoords[0].restaurantCoordinates);
    }
    
    // Check pending orders
    const pendingOrders = await redisClient.sMembers('pending_orders');
    console.log('📦 Pending orders:', pendingOrders.length);
    
    if (pendingOrders.length > 0) {
      const orderId = pendingOrders[0];
      const order = await Order.findById(orderId).lean();
      console.log('📍 Pending order coordinates:', order?.restaurantCoordinates);
      console.log('📍 Has coordinates:', !!order?.restaurantCoordinates?.latitude);
    }
    
    await redisClient.disconnect();
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkOrderCoordinates();
