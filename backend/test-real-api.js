const axios = require('axios');
require('dotenv').config();

async function testRealApi() {
  const baseUrl = process.env.API_URL || 'http://localhost:3001';
  
  try {
    // 1. Đăng nhập customer
    console.log('🔐 Logging in customer...');
    const customerLoginResponse = await axios.post(`${baseUrl}/api/v1/auth/login`, {
      email: 'customer@eatnow.com',
      password: 'password123'
    });
    
    const customerToken = customerLoginResponse.data.token;
    console.log('✅ Customer logged in');
    
    // 2. Tạo đơn hàng tiền mặt mới
    console.log('📦 Creating new cash order...');
    const orderResponse = await axios.post(`${baseUrl}/api/v1/orders`, {
      restaurantId: '68d3e318aae2d15aa251c219',
      items: [
        {
          itemId: '507f1f77bcf86cd799439011',
          name: 'Test Item',
          price: 50000,
          quantity: 1,
          subtotal: 50000
        }
      ],
      subtotal: 50000,
      deliveryFee: 10000,
      tip: 0,
      finalTotal: 60000,
      paymentMethod: 'cash',
      deliveryAddress: {
        addressLine: '123 Test Street',
        recipientName: 'Test User',
        recipientPhone: '0123456789'
      }
    }, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    
    const order = orderResponse.data;
    console.log('✅ Order created:', {
      id: order._id,
      finalTotal: order.finalTotal,
      paymentMethod: order.paymentMethod
    });
    
    // 3. Đăng nhập driver
    console.log('\n🔐 Logging in driver...');
    const loginResponse = await axios.post(`${baseUrl}/api/v1/auth/login`, {
      email: 'tx1@gmail.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Driver logged in');
    
    // 4. Thử nhận đơn hàng
    console.log('\n🚗 Attempting to accept order...');
    try {
      const acceptResponse = await axios.patch(
        `${baseUrl}/api/v1/orders/${order._id}/accept`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('✅ Order accepted successfully:', acceptResponse.data);
    } catch (acceptError) {
      console.log('❌ Failed to accept order:');
      console.log('Status:', acceptError.response?.status);
      console.log('Data:', acceptError.response?.data);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testRealApi();
