// Test script với token thật
const axios = require('axios');

const API_BASE = 'http://localhost:3001/api/v1';

async function testWithRealToken() {
  try {
    console.log('🧪 Testing with Real Token...\n');

    // Lấy token từ command line argument
    const token = process.argv[2];
    if (!token) {
      console.log('❌ Vui lòng cung cấp JWT token:');
      console.log('node test-with-real-token.js YOUR_JWT_TOKEN_HERE');
      console.log('');
      console.log('Để lấy token:');
      console.log('1. Mở browser console (F12)');
      console.log('2. Gõ: localStorage.getItem("eatnow_token")');
      console.log('3. Copy token và chạy script');
      return;
    }

    console.log('🔑 Using token:', token.substring(0, 20) + '...');

    // Test orders API
    console.log('\n1️⃣ Testing orders API:');
    try {
      const response = await axios.get(`${API_BASE}/orders/customer`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('✅ Orders API Response:');
      console.log('   Status:', response.status);
      console.log('   Orders count:', response.data.length);
      
      if (response.data.length > 0) {
        console.log('\n📋 Sample Order:');
        const sampleOrder = response.data[0];
        console.log(`   Order ID: ${sampleOrder._id}`);
        console.log(`   Order Code: ${sampleOrder.orderCode}`);
        console.log(`   Status: ${sampleOrder.status}`);
        console.log(`   Total: ${sampleOrder.finalTotal}đ`);
        console.log(`   Restaurant: ${sampleOrder.restaurantId?.name || 'N/A'}`);
      }
    } catch (error) {
      console.log('❌ Orders API Error:', error.response?.status, error.response?.data?.message);
    }

    // Test customer profile API
    console.log('\n2️⃣ Testing customer profile API:');
    try {
      const response = await axios.get(`${API_BASE}/customer/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('✅ Customer Profile API Response:');
      console.log('   Status:', response.status);
      console.log('   Customer name:', response.data.name);
      console.log('   Customer ID:', response.data._id);
    } catch (error) {
      console.log('❌ Customer Profile API Error:', error.response?.status, error.response?.data?.message);
    }

    // Test auth/me API
    console.log('\n3️⃣ Testing auth/me API:');
    try {
      const response = await axios.get(`${API_BASE}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('✅ Auth/Me API Response:');
      console.log('   Status:', response.status);
      console.log('   User ID:', response.data.id);
      console.log('   User email:', response.data.email);
      console.log('   User role:', response.data.role);
    } catch (error) {
      console.log('❌ Auth/Me API Error:', error.response?.status, error.response?.data?.message);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

testWithRealToken();






