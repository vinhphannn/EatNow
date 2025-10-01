// Kiểm tra customer profile có được tạo không
const mongoose = require('mongoose');

async function checkCustomerCreated() {
  try {
    await mongoose.connect('mongodb://localhost:27017/eatnow');
    
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const Customer = mongoose.model('Customer', new mongoose.Schema({}, { strict: false }));
    
    // Tìm user vừa tạo
    const user = await User.findOne({ email: 'test123@example.com' });
    console.log('👤 User found:', {
      id: user._id,
      email: user.email,
      role: user.role,
      customerProfile: user.customerProfile
    });
    
    if (user.customerProfile) {
      const customer = await Customer.findById(user.customerProfile);
      console.log('✅ Customer profile found:', {
        id: customer._id,
        userId: customer.userId,
        name: customer.name,
        fullName: customer.fullName
      });
    } else {
      console.log('❌ No customer profile linked to user');
    }
    
    // Kiểm tra tất cả customers
    const allCustomers = await Customer.find().sort({ createdAt: -1 }).limit(5);
    console.log('\n📊 Recent customers:');
    allCustomers.forEach(c => {
      console.log(`   ${c.email || 'No email'} - ${c.name} (${c._id})`);
    });
    
    await mongoose.connection.close();
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkCustomerCreated();






