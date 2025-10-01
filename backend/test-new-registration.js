// Test đăng ký user mới và kiểm tra customer profile
const axios = require('axios');

async function testNewRegistration() {
  try {
    console.log('🧪 Testing New User Registration...\n');

    // Test data
    const testEmail = `test${Date.now()}@example.com`;
    const testData = {
      email: testEmail,
      password: 'password123',
      name: 'Test User New',
      phone: '0123456789',
      role: 'customer'
    };

    console.log('📝 Test data:', testData);

    // 1. Register new user
    console.log('\n1️⃣ Registering new user...');
    const registerResponse = await axios.post('http://localhost:3001/api/v1/auth/register', testData);
    console.log('✅ Registration successful:', registerResponse.data);

    const token = registerResponse.data.access_token;
    const userId = registerResponse.data.user.id;

    // 2. Test login
    console.log('\n2️⃣ Testing login...');
    const loginResponse = await axios.post('http://localhost:3001/api/v1/auth/login', {
      email: testEmail,
      password: 'password123'
    });
    console.log('✅ Login successful:', loginResponse.data);

    // 3. Test customer profile API
    console.log('\n3️⃣ Testing customer profile API...');
    try {
      const profileResponse = await axios.get('http://localhost:3001/api/v1/customer/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('✅ Customer profile found:', profileResponse.data);
    } catch (error) {
      console.log('❌ Customer profile API error:', error.response?.data || error.message);
    }

    // 4. Test add address
    console.log('\n4️⃣ Testing add address...');
    try {
      const addressResponse = await axios.post('http://localhost:3001/api/v1/customer/addresses', {
        label: 'Nhà',
        addressLine: '123 Test Street',
        latitude: 10.123456,
        longitude: 106.123456
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('✅ Address added successfully:', addressResponse.data);
    } catch (error) {
      console.log('❌ Add address error:', error.response?.data || error.message);
    }

    // 5. Check database directly
    console.log('\n5️⃣ Checking database directly...');
    const mongoose = require('mongoose');
    await mongoose.connect('mongodb://localhost:27017/eatnow');
    
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const Customer = mongoose.model('Customer', new mongoose.Schema({}, { strict: false }));
    
    const user = await User.findById(userId);
    console.log('👤 User found:', {
      id: user._id,
      email: user.email,
      role: user.role,
      customerProfile: user.customerProfile
    });
    
    if (user.customerProfile) {
      const customer = await Customer.findById(user.customerProfile);
      console.log('👤 Customer profile found:', {
        id: customer._id,
        userId: customer.userId,
        name: customer.name,
        fullName: customer.fullName
      });
    } else {
      console.log('❌ No customer profile linked to user');
    }
    
    await mongoose.connection.close();

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testNewRegistration();






