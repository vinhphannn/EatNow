// Test script để kiểm tra API orders sau khi fix
const axios = require('axios');

const API_BASE = 'http://localhost:3001/api/v1';

async function testOrdersAPI() {
  try {
    console.log('🧪 Testing Orders API After Fix...\n');

    // 1. Test với token giả (sẽ fail)
    console.log('1️⃣ Testing with fake token:');
    try {
      const response = await axios.get(`${API_BASE}/orders/customer`, {
        headers: {
          'Authorization': 'Bearer fake-token'
        }
      });
      console.log('✅ Response:', response.data);
    } catch (error) {
      console.log('❌ Expected error:', error.response?.status, error.response?.data?.message);
    }
    console.log('');

    // 2. Test không có token
    console.log('2️⃣ Testing without token:');
    try {
      const response = await axios.get(`${API_BASE}/orders/customer`);
      console.log('✅ Response:', response.data);
    } catch (error) {
      console.log('❌ Expected error:', error.response?.status, error.response?.data?.message);
    }
    console.log('');

    // 3. Test với token thật (nếu có)
    const token = process.argv[2];
    if (token) {
      console.log('3️⃣ Testing with real token:');
      try {
        const response = await axios.get(`${API_BASE}/orders/customer`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        console.log('✅ Response:', response.data);
        console.log('📦 Orders count:', response.data.length);
        
        if (response.data.length > 0) {
          console.log('\n📋 Sample Order:');
          const sampleOrder = response.data[0];
          console.log(`   Order ID: ${sampleOrder._id}`);
          console.log(`   Order Code: ${sampleOrder.orderCode}`);
          console.log(`   Status: ${sampleOrder.status}`);
          console.log(`   Total: ${sampleOrder.finalTotal}đ`);
          console.log(`   Restaurant: ${sampleOrder.restaurantId?.name || 'N/A'}`);
          console.log(`   Driver: ${sampleOrder.driverId?.name || 'N/A'}`);
        }
      } catch (error) {
        console.log('❌ Error:', error.response?.status, error.response?.data?.message);
      }
    } else {
      console.log('3️⃣ Skipping real token test (no token provided)');
      console.log('   To test with real token: node test-orders-api-fixed.js YOUR_JWT_TOKEN');
    }

    // 4. Test customer profile API
    console.log('\n4️⃣ Testing customer profile API:');
    if (token) {
      try {
        const response = await axios.get(`${API_BASE}/customer/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        console.log('✅ Customer profile response:', response.data);
      } catch (error) {
        console.log('❌ Customer profile error:', error.response?.status, error.response?.data?.message);
      }
    } else {
      console.log('   Skipping customer profile test (no token provided)');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

testOrdersAPI();






