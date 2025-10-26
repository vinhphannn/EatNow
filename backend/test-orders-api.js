const fetch = require('node-fetch');

async function testOrdersAPI() {
  try {
    console.log('Testing /api/v1/orders/customer...');
    
    const response = await fetch('http://localhost:3001/api/v1/orders/customer', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers.raw());
    
    if (response.ok) {
      const data = await response.json();
      console.log('Response data:', JSON.stringify(data, null, 2));
    } else {
      const errorText = await response.text();
      console.log('Error response:', errorText);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testOrdersAPI();
