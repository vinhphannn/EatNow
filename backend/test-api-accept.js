const axios = require('axios');
require('dotenv').config();

async function testApiAccept() {
  const baseUrl = process.env.API_URL || 'http://localhost:3001';
  
  try {
    // 1. Đăng nhập driver
    console.log('🔐 Logging in driver...');
    const loginResponse = await axios.post(`${baseUrl}/api/v1/auth/login`, {
      email: 'tx1@gmail.com', // Driver khác
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Driver logged in, token:', token.substring(0, 20) + '...');
    
    // 2. Lấy thông tin driver
    console.log('👤 Getting driver info...');
    const driverResponse = await axios.get(`${baseUrl}/api/v1/drivers/mine`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('👤 Driver info:', driverResponse.data);
    
    // 3. Lấy đơn hàng available
    console.log('📦 Getting available orders...');
    const ordersResponse = await axios.get(`${baseUrl}/api/v1/orders/available`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const availableOrders = ordersResponse.data;
    console.log('📦 Available orders:', availableOrders.length);
    
    if (availableOrders.length === 0) {
      console.log('❌ No available orders found');
      return;
    }
    
    // 4. Tìm đơn hàng tiền mặt
    const cashOrder = availableOrders.find(order => order.paymentMethod === 'cash');
    if (!cashOrder) {
      console.log('❌ No cash orders found');
      return;
    }
    
    console.log('💰 Found cash order:', {
      id: cashOrder._id,
      finalTotal: cashOrder.finalTotal,
      paymentMethod: cashOrder.paymentMethod
    });
    
    // 5. Thử nhận đơn hàng
    console.log('🚗 Attempting to accept order...');
    try {
      const acceptResponse = await axios.patch(
        `${baseUrl}/api/v1/orders/${cashOrder._id}/accept`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('✅ Order accepted successfully:', acceptResponse.data);
    } catch (acceptError) {
      console.log('❌ Failed to accept order:');
      console.log('Status:', acceptError.response?.status);
      console.log('Data:', acceptError.response?.data);
      console.log('Message:', acceptError.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testApiAccept();
