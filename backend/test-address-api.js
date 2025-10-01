// Test address API
const axios = require('axios');

async function testAddressAPI() {
  try {
    console.log('🧪 Testing Address API...\n');

    // 1. Login to get token
    console.log('1️⃣ Logging in...');
    const loginResponse = await axios.post('http://localhost:3001/api/v1/auth/login', {
      email: 'alice@example.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.access_token;
    const userId = loginResponse.data.user.id;
    console.log('✅ Login successful, userId:', userId);

    // 2. Test get customer profile
    console.log('\n2️⃣ Getting customer profile...');
    try {
      const profileResponse = await axios.get('http://localhost:3001/api/v1/customer/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('✅ Customer profile found:', profileResponse.data);
    } catch (error) {
      console.log('❌ Customer profile error:', error.response?.data || error.message);
    }

    // 3. Test add address
    console.log('\n3️⃣ Testing add address...');
    const addressData = {
      label: 'Nhà',
      addressLine: '123 Test Street',
      latitude: 10.123456,
      longitude: 106.123456,
      city: 'TP. Hồ Chí Minh',
      ward: 'Bến Nghé',
      note: 'Test address',
      phone: '0123456789',
      recipientName: 'Test User',
      isDefault: true,
      isActive: true
    };

    try {
      const addResponse = await axios.post('http://localhost:3001/api/v1/customer/addresses', addressData, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('✅ Address added successfully:', addResponse.data);
    } catch (error) {
      console.log('❌ Add address error:', error.response?.data || error.message);
    }

    // 4. Test get addresses again
    console.log('\n4️⃣ Getting customer profile again...');
    try {
      const profileResponse2 = await axios.get('http://localhost:3001/api/v1/customer/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('✅ Customer profile with addresses:', profileResponse2.data);
    } catch (error) {
      console.log('❌ Customer profile error:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testAddressAPI();
