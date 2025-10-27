const mongoose = require('mongoose');
const redis = require('redis');

const uri = 'mongodb+srv://infovinhphan_db_user:dE1Arv8M7IhQBdkH@cluster0.qwdcq4j.mongodb.net/eatnow?retryWrites=true&w=majority&appName=Cluster0';

async function checkPendingOrderStatus() {
  try {
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');
    
    const redisClient = redis.createClient({ url: 'redis://localhost:6379' });
    await redisClient.connect();
    console.log('✅ Connected to Redis');
    
    // Check pending orders
    const pendingOrders = await redisClient.sMembers('pending_orders');
    console.log('📦 Pending orders:', pendingOrders.length);
    
    if (pendingOrders.length > 0) {
      const orderId = pendingOrders[0];
      console.log('🎯 Checking order:', orderId);
      
      const orderSchema = new mongoose.Schema({
        status: String,
        driverId: mongoose.Schema.Types.ObjectId,
        restaurantCoordinates: {
          latitude: Number,
          longitude: Number
        }
      }, { collection: 'orders' });
      
      const Order = mongoose.model('OrderTest', orderSchema);
      const order = await Order.findById(orderId).lean();
      
      console.log('📊 Order status:', order.status);
      console.log('🚗 Order driverId:', order.driverId);
      console.log('📍 Order coordinates:', order.restaurantCoordinates);
      
      // Check if order is valid for assignment
      if (order.driverId) {
        console.log('⚠️ Order already has driver');
      } else if (['delivered', 'cancelled'].includes(order.status)) {
        console.log('⚠️ Order in final state');
      } else if (!order.restaurantCoordinates?.latitude || !order.restaurantCoordinates?.longitude) {
        console.log('⚠️ Order missing coordinates');
      } else {
        console.log('✅ Order is valid for assignment');
      }
    }
    
    await redisClient.disconnect();
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkPendingOrderStatus();
