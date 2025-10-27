const mongoose = require('mongoose');
const redis = require('redis');

const uri = 'mongodb+srv://infovinhphan_db_user:dE1Arv8M7IhQBdkH@cluster0.qwdcq4j.mongodb.net/eatnow?retryWrites=true&w=majority&appName=Cluster0';

async function testCreateOrderWithToken() {
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
    
    // First, get a valid token by logging in
    console.log('🔄 Getting valid token...');
    
    const loginResponse = await fetch('http://localhost:3001/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'customer@eatnow.com',
        password: 'password123'
      })
    });
    
    if (!loginResponse.ok) {
      console.log('❌ Failed to login:', loginResponse.status);
      return;
    }
    
    const loginData = await loginResponse.json();
    console.log('✅ Login successful');
    
    // Extract cookies from response
    const cookies = loginResponse.headers.get('set-cookie');
    console.log('🍪 Cookies received:', cookies);
    
    // Create order with valid cookies
    console.log('🔄 Creating order with valid token...');
    
    const orderData = {
      restaurantId: '68db6c57ac778a9cb703afd9',
      deliveryAddress: {
        address: '123 Test Street, District 1, HCMC',
        coordinates: {
          latitude: 10.790978987133327,
          longitude: 106.68751522409114
        }
      },
      recipient: {
        name: 'Test Customer',
        phone: '0123456789'
      },
      paymentMethod: 'cash',
      tip: 0,
      doorFee: false,
      deliveryFee: 15000
    };
    
    const response = await fetch('http://localhost:3001/api/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies || 'customer_access_token=test'
      },
      body: JSON.stringify(orderData)
    });
    
    if (response.ok) {
      const order = await response.json();
      console.log('✅ Order created successfully:', order._id);
      
      // Wait for assignment to process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check final state
      const pendingOrdersAfter = await redisClient.sMembers('pending_orders');
      const availableDriversAfter = await redisClient.sMembers('available_drivers');
      
      console.log('📊 Final state:');
      console.log('📦 Pending orders:', pendingOrdersAfter.length);
      console.log('🚗 Available drivers:', availableDriversAfter.length);
      
      // Check if order was assigned
      const orderSchema = new mongoose.Schema({
        driverId: mongoose.Schema.Types.ObjectId,
        status: String
      }, { collection: 'orders' });
      
      const Order = mongoose.model('OrderTest', orderSchema);
      const updatedOrder = await Order.findById(order._id).lean();
      
      console.log('📊 Order after assignment:');
      console.log('🚗 Order driverId:', updatedOrder.driverId);
      console.log('📊 Order status:', updatedOrder.status);
      
      if (updatedOrder.driverId) {
        console.log('✅ Auto assignment successful!');
      } else {
        console.log('❌ Auto assignment failed');
      }
      
    } else {
      const error = await response.text();
      console.log('❌ Failed to create order:', response.status, error);
    }
    
    await redisClient.disconnect();
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testCreateOrderWithToken();
