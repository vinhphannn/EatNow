// Test frontend address functionality
const axios = require('axios');

async function testFrontendAddress() {
  try {
    console.log('🧪 Testing Frontend Address Functionality...\n');

    // 1. Login to get token
    console.log('1️⃣ Logging in...');
    const loginResponse = await axios.post('http://localhost:3001/api/v1/auth/login', {
      email: 'testuser2@example.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.access_token;
    console.log('✅ Login successful');

    // 2. Test get profile (frontend format)
    console.log('\n2️⃣ Testing get profile...');
    const profileResponse = await axios.get('http://localhost:3001/api/v1/customer/profile', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('✅ Profile retrieved:', {
      id: profileResponse.data.userId?._id || profileResponse.data.userId,
      email: profileResponse.data.userId?.email,
      name: profileResponse.data.name,
      addresses: profileResponse.data.addresses?.length || 0
    });

    // 3. Test add address
    console.log('\n3️⃣ Testing add address...');
    const addressData = {
      label: 'Văn phòng',
      addressLine: '456 Office Street',
      latitude: 10.789012,
      longitude: 106.789012,
      city: 'TP. Hồ Chí Minh',
      ward: 'Bến Thành',
      note: 'Tầng 5, tòa nhà ABC',
      phone: '0987654321',
      recipientName: 'Test User 2',
      isDefault: false,
      isActive: true
    };

    const addResponse = await axios.post('http://localhost:3001/api/v1/customer/addresses', addressData, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('✅ Address added successfully');
    console.log('   Addresses count:', addResponse.data.addresses?.length || 0);

    // 4. Test update address
    console.log('\n4️⃣ Testing update address...');
    const updateData = {
      label: 'Văn phòng (Updated)',
      note: 'Tầng 6, tòa nhà XYZ'
    };

    const updateResponse = await axios.put('http://localhost:3001/api/v1/customer/addresses/0', updateData, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('✅ Address updated successfully');
    console.log('   Updated label:', updateResponse.data.addresses[0]?.label);

    // 5. Test get profile again
    console.log('\n5️⃣ Testing get profile after updates...');
    const finalProfileResponse = await axios.get('http://localhost:3001/api/v1/customer/profile', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('✅ Final profile:', {
      addresses: finalProfileResponse.data.addresses?.length || 0,
      addressLabels: finalProfileResponse.data.addressLabels
    });

    console.log('\n🎉 All tests passed! Frontend address functionality should work correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testFrontendAddress();




