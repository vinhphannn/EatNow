const mongoose = require('mongoose');
const redis = require('redis');

const uri = 'mongodb+srv://infovinhphan_db_user:dE1Arv8M7IhQBdkH@cluster0.qwdcq4j.mongodb.net/eatnow?retryWrites=true&w=majority&appName=Cluster0';

async function testAssignment() {
  try {
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');
    
    const redisClient = redis.createClient({ url: 'redis://localhost:6379' });
    await redisClient.connect();
    console.log('✅ Connected to Redis');
    
    // Get pending orders
    const pendingOrders = await redisClient.sMembers('pending_orders');
    console.log('📦 Pending orders:', pendingOrders.length);
    
    if (pendingOrders.length === 0) {
      console.log('❌ No pending orders');
      return;
    }
    
    // Get first pending order
    const orderId = pendingOrders[0];
    console.log('🎯 Testing assignment for order:', orderId);
    
    // Get order details from MongoDB
    const orderSchema = new mongoose.Schema({
      restaurantCoordinates: {
        latitude: Number,
        longitude: Number
      },
      driverId: mongoose.Schema.Types.ObjectId,
      status: String
    }, { collection: 'orders' });
    
    const Order = mongoose.model('OrderTest', orderSchema);
    const order = await Order.findById(orderId).lean();
    
    if (!order) {
      console.log('❌ Order not found');
      return;
    }
    
    console.log('📍 Order restaurant coordinates:', order.restaurantCoordinates);
    console.log('🚗 Order driverId:', order.driverId);
    console.log('📊 Order status:', order.status);
    
    if (order.driverId) {
      console.log('⚠️ Order already has driver');
      return;
    }
    
    if (!order.restaurantCoordinates || !order.restaurantCoordinates.latitude || !order.restaurantCoordinates.longitude) {
      console.log('❌ Order missing restaurant coordinates');
      return;
    }
    
    // Get available drivers
    const availableDrivers = await redisClient.sMembers('available_drivers');
    console.log('🚗 Available drivers:', availableDrivers.length);
    
    if (availableDrivers.length === 0) {
      console.log('❌ No available drivers');
      return;
    }
    
    // Check driver location
    const driverId = availableDrivers[0];
    const driverLocation = await redisClient.hGetAll(`driver_location:${driverId}`);
    console.log('📍 Driver location:', driverLocation);
    
    if (!driverLocation.lat || !driverLocation.lng) {
      console.log('❌ Driver has no location in Redis');
      return;
    }
    
    // Calculate distance (simple haversine)
    const lat1 = order.restaurantCoordinates.latitude;
    const lng1 = order.restaurantCoordinates.longitude;
    const lat2 = parseFloat(driverLocation.lat);
    const lng2 = parseFloat(driverLocation.lng);
    
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    console.log('📏 Distance:', distance.toFixed(2), 'km');
    
    if (distance > 10) {
      console.log('❌ Distance too far (>10km)');
      return;
    }
    
    console.log('✅ Assignment conditions met! Distance:', distance.toFixed(2), 'km');
    console.log('🎯 Ready to assign order', orderId, 'to driver', driverId);
    
    await redisClient.disconnect();
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAssignment();
