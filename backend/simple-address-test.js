// Simple address test
const axios = require('axios');

async function test() {
  try {
    console.log('Testing login...');
    
    const response = await axios.post('http://localhost:3001/api/v1/auth/login', {
      email: 'alice@example.com',
      password: 'password123'
    });
    
    console.log('Login successful:', response.data);
    
    const token = response.data.access_token;
    
    console.log('\nTesting customer profile...');
    const profileResponse = await axios.get('http://localhost:3001/api/v1/customer/profile', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('Profile response:', profileResponse.data);
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

test();




