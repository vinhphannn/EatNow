const mongoose = require('mongoose');
const redis = require('redis');

const uri = 'mongodb+srv://infovinhphan_db_user:dE1Arv8M7IhQBdkH@cluster0.qwdcq4j.mongodb.net/eatnow?retryWrites=true&w=majority&appName=Cluster0';

async function createTestOrder() {
  try {
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');
    
    const redisClient = redis.createClient({ url: 'redis://localhost:6379' });
    await redisClient.connect();
    console.log('✅ Connected to Redis');
    
    // Check current state
    const pendingOrdersBefore = await redisClient.sMembers('pending_orders');
    const availableDriversBefore = await redisClient.sMembers('available_drivers');
    
    console.log('📊 Before creating order:');
    console.log('📦 Pending orders:', pendingOrdersBefore.length);
    console.log('🚗 Available drivers:', availableDriversBefore.length);
    
    // Create test order via API
    console.log('🔄 Creating test order...');
    
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
        'Cookie': 'customer_access_token=test'
      },
      body: JSON.stringify(orderData)
    });
    
    if (response.ok) {
      const order = await response.json();
      console.log('✅ Order created successfully:', order._id);
      
      // Wait a bit for assignment to process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check state after order creation
      const pendingOrdersAfter = await redisClient.sMembers('pending_orders');
      const availableDriversAfter = await redisClient.sMembers('available_drivers');
      
      console.log('📊 After creating order:');
      console.log('📦 Pending orders:', pendingOrdersAfter.length);
      console.log('🚗 Available drivers:', availableDriversAfter.length);
      
      if (pendingOrdersAfter.length > pendingOrdersBefore.length) {
        console.log('✅ Order added to pending queue');
      }
      
      if (availableDriversAfter.length < availableDriversBefore.length) {
        console.log('✅ Driver assigned to order');
      } else {
        console.log('⚠️ Driver not assigned - checking for errors');
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

createTestOrder();
