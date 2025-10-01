// Script để test API orders trực tiếp
const axios = require('axios');

const API_BASE = 'http://localhost:3001/api/v1';

async function testOrdersAPI() {
  try {
    console.log('🔍 Testing Orders API...\n');

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
      } catch (error) {
        console.log('❌ Error:', error.response?.status, error.response?.data?.message);
      }
    } else {
      console.log('3️⃣ Skipping real token test (no token provided)');
      console.log('   To test with real token: node test-orders-api.js YOUR_JWT_TOKEN');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

testOrdersAPI();






