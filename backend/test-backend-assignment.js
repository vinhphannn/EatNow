const mongoose = require('mongoose');
const redis = require('redis');

const uri = 'mongodb+srv://infovinhphan_db_user:dE1Arv8M7IhQBdkH@cluster0.qwdcq4j.mongodb.net/eatnow?retryWrites=true&w=majority&appName=Cluster0';

async function testBackendAssignment() {
  try {
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');
    
    const redisClient = redis.createClient({ url: 'redis://localhost:6379' });
    await redisClient.connect();
    console.log('✅ Connected to Redis');
    
    // Test API call to trigger assignment
    console.log('🔄 Testing backend assignment API...');
    
    const response = await fetch('http://localhost:3001/api/v1/driver/test/smart-assignment/trigger', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Assignment API response:', data);
    } else {
      const error = await response.text();
      console.log('❌ Assignment API error:', response.status, error);
    }
    
    // Check Redis after API call
    const pendingOrders = await redisClient.sMembers('pending_orders');
    const availableDrivers = await redisClient.sMembers('available_drivers');
    
    console.log('📊 After API call:');
    console.log('📦 Pending orders:', pendingOrders.length);
    console.log('🚗 Available drivers:', availableDrivers.length);
    
    await redisClient.disconnect();
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testBackendAssignment();