const mongoose = require('mongoose');
const redis = require('redis');

const uri = 'mongodb+srv://infovinhphan_db_user:dE1Arv8M7IhQBdkH@cluster0.qwdcq4j.mongodb.net/eatnow?retryWrites=true&w=majority&appName=Cluster0';

async function testAutoAssignmentDirect() {
  try {
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');
    
    const redisClient = redis.createClient({ url: 'redis://localhost:6379' });
    await redisClient.connect();
    console.log('✅ Connected to Redis');
    
    // Check initial state
    const pendingOrdersBefore = await redisClient.sMembers('pending_orders');
    const availableDriversBefore = await redisClient.sMembers('available_drivers');
    
    console.log('📊 Initial state:');
    console.log('📦 Pending orders:', pendingOrdersBefore.length);
    console.log('🚗 Available drivers:', availableDriversBefore.length);
    
    // Create a test order directly in MongoDB
    console.log('🔄 Creating test order...');
    
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
    
    // Simulate the assignment logic from OrderService.createOrder
    console.log('🔄 Starting assignment process...');
    
    // Add to pending orders
    await redisClient.sAdd('pending_orders', savedOrder._id.toString());
    console.log('✅ Order added to pending queue');
    
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
      
      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check final state
      const pendingOrdersAfter = await redisClient.sMembers('pending_orders');
      const availableDriversAfter = await redisClient.sMembers('available_drivers');
      
      console.log('📊 Final state:');
      console.log('📦 Pending orders:', pendingOrdersAfter.length);
      console.log('🚗 Available drivers:', availableDriversAfter.length);
      
      // Check if order was assigned
      const updatedOrder = await Order.findById(savedOrder._id).lean();
      console.log('📊 Order after assignment:');
      console.log('🚗 Order driverId:', updatedOrder.driverId);
      console.log('📊 Order status:', updatedOrder.status);
      
      if (updatedOrder.driverId) {
        console.log('✅ Auto assignment successful!');
      } else {
        console.log('❌ Auto assignment failed');
      }
      
      // Clean up test order
      await Order.findByIdAndDelete(savedOrder._id);
      console.log('🧹 Test order cleaned up');
      
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

testAutoAssignmentDirect();
