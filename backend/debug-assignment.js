const mongoose = require('mongoose');
const redis = require('redis');

const uri = 'mongodb+srv://infovinhphan_db_user:dE1Arv8M7IhQBdkH@cluster0.qwdcq4j.mongodb.net/eatnow?retryWrites=true&w=majority&appName=Cluster0';

async function debugAssignment() {
  try {
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');
    
    const redisClient = redis.createClient({ url: 'redis://localhost:6379' });
    await redisClient.connect();
    console.log('✅ Connected to Redis');
    
    // Get a pending order
    const pendingOrders = await redisClient.sMembers('pending_orders');
    if (pendingOrders.length === 0) {
      console.log('❌ No pending orders');
      return;
    }
    
    const orderId = pendingOrders[0];
    console.log('🎯 Debugging assignment for order:', orderId);
    
    // Get order details
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
    
    // Check available drivers from DB
    const driverSchema = new mongoose.Schema({
      status: String,
      deliveryStatus: String,
      currentOrderId: mongoose.Schema.Types.ObjectId,
      location: [Number],
      rating: Number,
      activeOrdersCount: Number,
      maxConcurrentOrders: Number
    }, { collection: 'drivers' });
    
    const Driver = mongoose.model('DriverTest', driverSchema);
    const drivers = await Driver.find({
      status: 'checkin',
      deliveryStatus: { $in: [null, undefined] },
      currentOrderId: { $in: [null, undefined] }
    }).select('_id status deliveryStatus currentOrderId location rating activeOrdersCount maxConcurrentOrders').lean();
    
    console.log('🚗 Available drivers from DB:', drivers.length);
    
    if (drivers.length === 0) {
      console.log('❌ No available drivers in DB');
      return;
    }
    
    const driverId = drivers[0]._id.toString();
    console.log('🎯 Testing driver:', driverId);
    console.log('📍 Driver status:', drivers[0].status);
    console.log('📍 Driver deliveryStatus:', drivers[0].deliveryStatus);
    console.log('📍 Driver currentOrderId:', drivers[0].currentOrderId);
    console.log('📍 Driver location:', drivers[0].location);
    
    // Check driver location in Redis
    const driverLocation = await redisClient.hGetAll(`driver_location:${driverId}`);
    console.log('📍 Driver location in Redis:', driverLocation);
    
    if (!driverLocation.lat || !driverLocation.lng) {
      console.log('❌ Driver has no location in Redis');
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
    
    // Check rating
    const rating = drivers[0].rating || 0;
    console.log('⭐ Driver rating:', rating);
    
    if (rating < 3.0) {
      console.log('❌ Rating too low');
      return;
    }
    
    // Check workload
    const activeOrdersCount = drivers[0].activeOrdersCount || 0;
    const maxConcurrentOrders = drivers[0].maxConcurrentOrders || 3;
    console.log('📊 Active orders:', activeOrdersCount, '/', maxConcurrentOrders);
    
    if (activeOrdersCount >= maxConcurrentOrders) {
      console.log('❌ Driver at max capacity');
      return;
    }
    
    console.log('✅ All conditions met for assignment');
    console.log('🔄 Testing assignment...');
    
    // Test assignment
    const response = await fetch('http://localhost:3001/api/v1/driver/test/smart-assignment/trigger', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Assignment triggered:', data);
      
      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check result
      const updatedOrder = await Order.findById(orderId).lean();
      console.log('📊 After assignment:');
      console.log('🚗 Order driverId:', updatedOrder.driverId);
      console.log('📊 Order status:', updatedOrder.status);
      
      if (updatedOrder.driverId) {
        console.log('✅ Assignment successful!');
      } else {
        console.log('❌ Assignment failed');
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

debugAssignment();
