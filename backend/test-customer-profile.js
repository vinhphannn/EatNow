// Test script để kiểm tra customer profile
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/eatnow', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define schemas
const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', userSchema);

const customerSchema = new mongoose.Schema({}, { strict: false });
const Customer = mongoose.model('Customer', customerSchema);

async function testCustomerProfile() {
  try {
    console.log('🔍 Testing Customer Profile...\n');

    // 1. Lấy user hiện tại (giả sử là user cuối cùng)
    const users = await User.find({ role: 'customer' }).sort({ createdAt: -1 }).limit(5);
    console.log('👥 Recent customer users:');
    users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} (${user._id})`);
    });

    if (users.length === 0) {
      console.log('❌ No customer users found');
      return;
    }

    const testUser = users[0];
    console.log(`\n🧪 Testing with user: ${testUser.email} (${testUser._id})`);

    // 2. Kiểm tra customer profile
    const customer = await Customer.findOne({ userId: testUser._id });
    if (customer) {
      console.log('✅ Customer profile found:');
      console.log(`   Customer ID: ${customer._id}`);
      console.log(`   Name: ${customer.name}`);
      console.log(`   Addresses: ${customer.addresses?.length || 0}`);
    } else {
      console.log('❌ Customer profile NOT found');
      console.log('   This user needs a customer profile to be created');
    }

    // 3. Test add address API
    console.log('\n🧪 Testing add address API...');
    const axios = require('axios');
    
    try {
      // Test với fake token (sẽ fail)
      const response = await axios.post('http://localhost:3001/api/v1/customer/addresses', {
        label: 'Test Address',
        addressLine: '123 Test Street',
        latitude: 10.123456,
        longitude: 106.123456,
        note: 'Test note'
      }, {
        headers: {
          'Authorization': 'Bearer fake-token'
        }
      });
      console.log('✅ API Response:', response.data);
    } catch (error) {
      console.log('❌ API Error (expected):', error.response?.status, error.response?.data?.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

testCustomerProfile();






