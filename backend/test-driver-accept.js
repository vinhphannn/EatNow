const axios = require('axios');
require('dotenv').config();

async function testDriverAccept() {
  const baseUrl = process.env.API_URL || 'http://localhost:3001';
  
  try {
    // 1. Đăng nhập driver
    console.log('🔐 Logging in driver...');
    const loginResponse = await axios.post(`${baseUrl}/api/v1/auth/login`, {
      email: 'driver@example.com', // Thay bằng email driver thực tế
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Driver logged in');
    
    // 2. Tìm đơn hàng tiền mặt chưa có tài xế
    console.log('🔍 Finding cash orders without driver...');
    const ordersResponse = await axios.get(`${baseUrl}/api/v1/orders/available`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const availableOrders = ordersResponse.data;
    console.log('📦 Available orders:', availableOrders.length);
    
    if (availableOrders.length === 0) {
      console.log('❌ No available orders found');
      return;
    }
    
    // 3. Tìm đơn hàng tiền mặt
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
    
    // 4. Thử nhận đơn hàng
    console.log('🚗 Attempting to accept order...');
    try {
      const acceptResponse = await axios.patch(
        `${baseUrl}/api/v1/orders/${cashOrder._id}/accept`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('✅ Order accepted successfully:', acceptResponse.data);
    } catch (acceptError) {
      console.log('❌ Failed to accept order:', acceptError.response?.data || acceptError.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testDriverAccept();
