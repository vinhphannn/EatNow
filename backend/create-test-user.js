// Create test user
const axios = require('axios');

async function createTestUser() {
  try {
    console.log('Creating test user...');
    
    const response = await axios.post('http://localhost:3001/api/v1/auth/register', {
      email: 'testuser2@example.com',
      password: 'password123',
      name: 'Test User 2',
      phone: '0123456789',
      role: 'customer'
    });
    
    console.log('User created:', response.data);
    
    // Test login
    console.log('\nTesting login...');
    const loginResponse = await axios.post('http://localhost:3001/api/v1/auth/login', {
      email: 'testuser2@example.com',
      password: 'password123'
    });
    
    console.log('Login successful:', loginResponse.data);
    
    const token = loginResponse.data.access_token;
    
    // Test customer profile
    console.log('\nTesting customer profile...');
    const profileResponse = await axios.get('http://localhost:3001/api/v1/customer/profile', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('Profile response:', profileResponse.data);
    
    // Test add address
    console.log('\nTesting add address...');
    const addressResponse = await axios.post('http://localhost:3001/api/v1/customer/addresses', {
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
    }, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('Address added:', addressResponse.data);
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

createTestUser();