// Simple test để kiểm tra đăng ký
const axios = require('axios');

async function test() {
  try {
    console.log('Testing registration...');
    
    const response = await axios.post('http://localhost:3001/api/v1/auth/register', {
      email: 'test111@example.com',
      password: 'password123',
      name: 'Test User',
      phone: '0123456789',
      role: 'customer'
    });
    
    console.log('Registration response:', response.data);
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

test();
