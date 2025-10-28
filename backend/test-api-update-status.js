const axios = require('axios');
require('dotenv').config();

async function testApiUpdateStatus() {
  const baseUrl = process.env.API_URL || 'http://localhost:3001';
  
  try {
    // 1. Đăng nhập driver
    console.log('🔐 Logging in driver...');
    const loginResponse = await axios.post(`${baseUrl}/api/v1/auth/login`, {
      email: 'tx1@gmail.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Driver logged in');
    
    // 2. Tìm đơn hàng đang picking_up
    console.log('📦 Finding order in picking_up status...');
    const ordersResponse = await axios.get(`${baseUrl}/api/v1/drivers/mine/orders/current`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const currentOrders = ordersResponse.data;
    console.log('Current orders:', currentOrders.length);
    
    if (currentOrders.length === 0) {
      console.log('❌ No current orders found');
      return;
    }
    
    const order = currentOrders[0];
    console.log('📦 Found order:', {
      id: order._id,
      code: order.code,
      status: order.status
    });
    
    // 3. Cập nhật status thành delivered
    console.log('🚗 Updating order status to delivered...');
    try {
      const updateResponse = await axios.patch(
        `${baseUrl}/api/v1/orders/${order._id}/delivered`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('✅ Order status updated successfully:', updateResponse.data);
    } catch (updateError) {
      console.log('❌ Failed to update order status:');
      console.log('Status:', updateError.response?.status);
      console.log('Data:', updateError.response?.data);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testApiUpdateStatus();
