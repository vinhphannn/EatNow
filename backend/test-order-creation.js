// Test script để kiểm tra tạo đơn hàng với khoảng cách
const axios = require('axios');

const API_BASE = 'http://localhost:3001/api/v1';

// Test data
const testOrderData = {
  items: [
    {
      itemId: '68c9c1f29f90fc92444b363f', // Replace with actual item ID
      name: 'Phở Bò',
      price: 50000,
      quantity: 2,
      subtotal: 100000,
      specialInstructions: 'Ít rau, nhiều thịt'
    }
  ],
  deliveryAddress: {
    label: 'Nhà',
    addressLine: '123 Đường ABC, Quận 1, TP.HCM',
    latitude: 10.7769,
    longitude: 106.7009,
    note: 'Tầng 2, căn hộ 201'
  },
  deliveryDistance: 5.2, // km
  deliveryFee: 5000, // VND
  paymentMethod: 'cash',
  promoCode: '',
  finalTotal: 105000
};

async function testCreateOrder() {
  try {
    console.log('🚀 Testing order creation with distance calculation...');
    console.log('📦 Order data:', JSON.stringify(testOrderData, null, 2));
    
    const response = await axios.post(`${API_BASE}/orders`, testOrderData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE' // Replace with actual token
      }
    });
    
    console.log('✅ Order created successfully!');
    console.log('📋 Order details:', JSON.stringify(response.data, null, 2));
    
    // Verify distance data
    if (response.data.deliveryDistance) {
      console.log(`📍 Delivery distance: ${response.data.deliveryDistance}km`);
    }
    
    if (response.data.deliveryFee) {
      console.log(`💰 Delivery fee: ${response.data.deliveryFee}đ`);
    }
    
  } catch (error) {
    console.error('❌ Error creating order:', error.response?.data || error.message);
  }
}

// Run test
testCreateOrder();






