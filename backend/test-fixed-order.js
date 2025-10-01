// Test script với dữ liệu đã fix
const axios = require('axios');

const API_BASE = 'http://localhost:3001/api/v1';

// Test data với format đúng
const testOrderData = {
  restaurantId: '68c9c18a9f90fc92444b3623', // Replace with actual restaurant ID
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
  total: 100000, // subtotal
  paymentMethod: 'cash', // Fixed: was 'cod'
  promoCode: '',
  finalTotal: 105000 // total + deliveryFee
};

async function testCreateOrder() {
  try {
    console.log('🚀 Testing FIXED order creation...');
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
    
    if (response.data.total) {
      console.log(`💵 Total: ${response.data.total}đ`);
    }
    
    if (response.data.finalTotal) {
      console.log(`💸 Final total: ${response.data.finalTotal}đ`);
    }
    
  } catch (error) {
    console.error('❌ Error creating order:', error.response?.data || error.message);
    
    if (error.response?.status === 500) {
      console.log('🔍 Server error details:');
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
    }
  }
}

// Run test
testCreateOrder();






