const mongoose = require('mongoose');
const redis = require('redis');

const uri = 'mongodb+srv://infovinhphan_db_user:dE1Arv8M7IhQBdkH@cluster0.qwdcq4j.mongodb.net/eatnow?retryWrites=true&w=majority&appName=Cluster0';

async function debugFindBestDriver() {
  try {
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');
    
    const redisClient = redis.createClient({ url: 'redis://localhost:6379' });
    await redisClient.connect();
    console.log('✅ Connected to Redis');
    
    // Create a test order
    const orderSchema = new mongoose.Schema({
      restaurantId: mongoose.Schema.Types.ObjectId,
      customerId: mongoose.Schema.Types.ObjectId,
      items: [{
        itemId: mongoose.Schema.Types.ObjectId,
        quantity: Number,
        price: Number,
        name: String
      }],
      deliveryAddress: {
        address: String,
        coordinates: {
          latitude: Number,
          longitude: Number
        }
      },
      restaurantCoordinates: {
        latitude: Number,
        longitude: Number
      },
      recipient: {
        name: String,
        phone: String
      },
      paymentMethod: String,
      subtotal: Number,
      deliveryFee: Number,
      tip: Number,
      doorFee: Boolean,
      finalTotal: Number,
      restaurantRevenue: Number,
      customerPayment: Number,
      driverPayment: Number,
      platformFeeRate: Number,
      platformFeeAmount: Number,
      driverCommissionRate: Number,
      driverCommissionAmount: Number,
      estimatedDeliveryTime: Number,
      deliveryDistance: Number,
      status: String,
      driverId: mongoose.Schema.Types.ObjectId,
      assignedAt: Date,
      createdAt: Date,
      updatedAt: Date
    }, { collection: 'orders' });
    
    const Order = mongoose.model('OrderTest', orderSchema);
    
    const testOrder = new Order({
      restaurantId: '68db6c57ac778a9cb703afd9',
      customerId: '68e25491bf525485bcfdd84e',
      items: [{
        itemId: '68db6c57ac778a9cb703afd9',
        quantity: 1,
        price: 50000,
        name: 'Test Item'
      }],
      deliveryAddress: {
        address: '123 Test Street, District 1, HCMC',
        coordinates: {
          latitude: 10.790978987133327,
          longitude: 106.68751522409114
        }
      },
      restaurantCoordinates: {
        latitude: 10.831418280235425,
        longitude: 106.67605432137188
      },
      recipient: {
        name: 'Test Customer',
        phone: '0123456789'
      },
      paymentMethod: 'cash',
      subtotal: 50000,
      deliveryFee: 15000,
      tip: 0,
      doorFee: false,
      finalTotal: 65000,
      restaurantRevenue: 45000,
      customerPayment: 65000,
      driverPayment: 10500,
      platformFeeRate: 10,
      platformFeeAmount: 5000,
      driverCommissionRate: 30,
      driverCommissionAmount: 4500,
      estimatedDeliveryTime: 25,
      deliveryDistance: 4.67,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    const savedOrder = await testOrder.save();
    console.log('✅ Test order created:', savedOrder._id);
    
    // Add to pending orders
    await redisClient.sAdd('pending_orders', savedOrder._id.toString());
    console.log('✅ Order added to pending queue');
    
    // Check available drivers
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
      console.log('❌ No available drivers');
      return;
    }
    
    const driverId = drivers[0]._id.toString();
    console.log('🎯 Testing driver:', driverId);
    
    // Check driver location in Redis
    const driverLocation = await redisClient.hGetAll(`driver_location:${driverId}`);
    console.log('📍 Driver location in Redis:', driverLocation);
    
    if (!driverLocation.lat || !driverLocation.lng) {
      console.log('❌ Driver has no location in Redis');
      return;
    }
    
    // Calculate distance
    const lat1 = savedOrder.restaurantCoordinates.latitude;
    const lng1 = savedOrder.restaurantCoordinates.longitude;
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
      const updatedOrder = await Order.findById(savedOrder._id).lean();
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
    
    // Clean up
    await Order.findByIdAndDelete(savedOrder._id);
    await redisClient.sRem('pending_orders', savedOrder._id.toString());
    console.log('🧹 Test order cleaned up');
    
    await redisClient.disconnect();
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugFindBestDriver();
