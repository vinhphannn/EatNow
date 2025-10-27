const mongoose = require('mongoose');
const redis = require('redis');

const uri = 'mongodb+srv://infovinhphan_db_user:dE1Arv8M7IhQBdkH@cluster0.qwdcq4j.mongodb.net/eatnow?retryWrites=true&w=majority&appName=Cluster0';

async function testOrderCreation() {
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
    
    // Check order details
    const order = await Order.findById(savedOrder._id).lean();
    console.log('📍 Order restaurant coordinates:', order.restaurantCoordinates);
    console.log('🚗 Order driverId:', order.driverId);
    console.log('📊 Order status:', order.status);
    
    // Add to pending orders
    await redisClient.sAdd('pending_orders', savedOrder._id.toString());
    console.log('✅ Order added to pending queue');
    
    // Check pending orders
    const pendingOrders = await redisClient.sMembers('pending_orders');
    console.log('📦 Pending orders:', pendingOrders.length);
    
    // Check if our order is in pending
    const isInPending = pendingOrders.includes(savedOrder._id.toString());
    console.log('✅ Order in pending queue:', isInPending);
    
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

testOrderCreation();
