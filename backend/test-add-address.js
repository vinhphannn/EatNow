// Test script để kiểm tra add address API
const axios = require('axios');

const API_BASE = 'http://localhost:3001/api/v1';

async function testAddAddress() {
  try {
    console.log('🧪 Testing Add Address API...\n');

    // Lấy token từ command line argument
    const token = process.argv[2];
    if (!token) {
      console.log('❌ Vui lòng cung cấp JWT token:');
      console.log('node test-add-address.js YOUR_JWT_TOKEN_HERE');
      return;
    }

    console.log('🔑 Using token:', token.substring(0, 20) + '...');

    // Test data
    const addressData = {
      label: 'Nhà',
      addressLine: '123 Test Street, Ward 1, District 1',
      latitude: 10.123456,
      longitude: 106.123456,
      note: 'Test address note',
      city: 'TP. Hồ Chí Minh',
      ward: 'Bến Nghé',
      phone: '0123456789',
      recipientName: 'Test User',
      isDefault: true,
      isActive: true
    };

    console.log('📋 Address data to send:');
    console.log(JSON.stringify(addressData, null, 2));

    // Test add address
    console.log('\n1️⃣ Testing add address:');
    try {
      const response = await axios.post(`${API_BASE}/customer/addresses`, addressData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ Add address success:');
      console.log('   Status:', response.status);
      console.log('   Response:', JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.log('❌ Add address error:');
      console.log('   Status:', error.response?.status);
      console.log('   Message:', error.response?.data?.message);
      console.log('   Error:', error.response?.data?.error);
      console.log('   Details:', error.response?.data);
    }

    // Test get customer profile
    console.log('\n2️⃣ Testing get customer profile:');
    try {
      const response = await axios.get(`${API_BASE}/customer/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('✅ Get profile success:');
      console.log('   Status:', response.status);
      console.log('   Addresses count:', response.data.addresses?.length || 0);
      if (response.data.addresses?.length > 0) {
        console.log('   Latest address:', response.data.addresses[response.data.addresses.length - 1]);
      }
    } catch (error) {
      console.log('❌ Get profile error:');
      console.log('   Status:', error.response?.status);
      console.log('   Message:', error.response?.data?.message);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

testAddAddress();






