const mongoose = require('mongoose');
const redis = require('redis');

const uri = 'mongodb+srv://infovinhphan_db_user:dE1Arv8M7IhQBdkH@cluster0.qwdcq4j.mongodb.net/eatnow?retryWrites=true&w=majority&appName=Cluster0';

async function testRealAssignment() {
  try {
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');
    
    const redisClient = redis.createClient({ url: 'redis://localhost:6379' });
    await redisClient.connect();
    console.log('✅ Connected to Redis');
    
    // Get a real pending order
    const pendingOrders = await redisClient.sMembers('pending_orders');
    console.log('📦 Available pending orders:', pendingOrders.length);
    
    if (pendingOrders.length === 0) {
      console.log('❌ No pending orders to test');
      return;
    }
    
    const orderId = pendingOrders[0];
    console.log('🎯 Testing assignment for order:', orderId);
    
    // Check order details
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
    
    // Check available drivers
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
      console.log('❌ Driver has no location');
      return;
    }
    
    // Calculate distance
    const lat1 = order.restaurantCoordinates.latitude;
    const lng1 = order.restaurantCoordinates.longitude;
    const lat2 = parseFloat(driverLocation.lat);
    const lng2 = parseFloat(driverLocation.lng);
    
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    console.log('📏 Distance:', distance.toFixed(2), 'km');
    
    if (distance > 10) {
      console.log('❌ Distance too far');
      return;
    }
    
    console.log('✅ All conditions met for assignment');
    console.log('🔄 Triggering assignment...');
    
    // Trigger assignment
    const response = await fetch('http://localhost:3001/api/v1/driver/test/smart-assignment/trigger', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Assignment triggered:', data);
      
      // Wait a bit for processing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if assignment happened
      const updatedOrder = await Order.findById(orderId).lean();
      const pendingOrdersAfter = await redisClient.sMembers('pending_orders');
      const availableDriversAfter = await redisClient.sMembers('available_drivers');
      
      console.log('📊 After assignment:');
      console.log('🚗 Order driverId:', updatedOrder.driverId);
      console.log('📊 Order status:', updatedOrder.status);
      console.log('📦 Pending orders:', pendingOrdersAfter.length);
      console.log('🚗 Available drivers:', availableDriversAfter.length);
      
      if (updatedOrder.driverId) {
        console.log('✅ Order assigned successfully!');
      } else {
        console.log('❌ Order not assigned');
      }
      
    } else {
      const error = await response.text();
      console.log('❌ Assignment failed:', response.status, error);
    }
    
    await redisClient.disconnect();
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testRealAssignment();
