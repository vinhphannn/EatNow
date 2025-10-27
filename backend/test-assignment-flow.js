const mongoose = require('mongoose');
const redis = require('redis');

const uri = 'mongodb+srv://infovinhphan_db_user:dE1Arv8M7IhQBdkH@cluster0.qwdcq4j.mongodb.net/eatnow?retryWrites=true&w=majority&appName=Cluster0';

async function testAssignmentFlow() {
  try {
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');
    
    const redisClient = redis.createClient({ url: 'redis://localhost:6379' });
    await redisClient.connect();
    console.log('✅ Connected to Redis');
    
    // Check current state
    const pendingOrdersBefore = await redisClient.sMembers('pending_orders');
    const availableDriversBefore = await redisClient.sMembers('available_drivers');
    
    console.log('📊 Current state:');
    console.log('📦 Pending orders:', pendingOrdersBefore.length);
    console.log('🚗 Available drivers:', availableDriversBefore.length);
    
    // Add a test order to pending queue
    const testOrderId = 'test-order-' + Date.now();
    await redisClient.sAdd('pending_orders', testOrderId);
    console.log('✅ Added test order to pending queue:', testOrderId);
    
    // Check state after adding
    const pendingOrdersAfter = await redisClient.sMembers('pending_orders');
    console.log('📦 Pending orders after:', pendingOrdersAfter.length);
    
    // Trigger assignment manually
    console.log('🔄 Triggering assignment...');
    const response = await fetch('http://localhost:3001/api/v1/driver/test/smart-assignment/trigger', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Assignment triggered:', data);
      
      // Check final state
      const pendingOrdersFinal = await redisClient.sMembers('pending_orders');
      const availableDriversFinal = await redisClient.sMembers('available_drivers');
      
      console.log('📊 Final state:');
      console.log('📦 Pending orders:', pendingOrdersFinal.length);
      console.log('🚗 Available drivers:', availableDriversFinal.length);
      
      // Clean up test order
      await redisClient.sRem('pending_orders', testOrderId);
      console.log('🧹 Cleaned up test order');
      
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

testAssignmentFlow();
