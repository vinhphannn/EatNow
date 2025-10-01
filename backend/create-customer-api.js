const axios = require('axios');

async function createCustomer() {
  try {
    console.log('Creating customer via API...');
    
    const response = await axios.post('http://localhost:3000/auth/register', {
      email: 'customer@eatnow.com',
      password: 'customer123',
      role: 'customer',
      name: 'Khách hàng demo',
      fullName: 'Khách hàng demo',
      phone: '0123456789'
    });

    console.log('Customer created successfully:', response.data);
  } catch (error) {
    if (error.response) {
      console.error('API Error:', error.response.status, error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

createCustomer();
