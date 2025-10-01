const mongoose = require('mongoose');

async function quickCheck() {
  try {
    await mongoose.connect('mongodb://localhost:27017/eatnow');
    
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const Customer = mongoose.model('Customer', new mongoose.Schema({}, { strict: false }));
    
    // Tìm user mới nhất
    const latestUser = await User.findOne({ email: 'test111@example.com' });
    console.log('Latest user:', latestUser ? latestUser._id : 'Not found');
    
    // Đếm customers
    const customerCount = await Customer.countDocuments();
    console.log('Total customers:', customerCount);
    
    // Tìm customer mới nhất
    const latestCustomer = await Customer.findOne().sort({ createdAt: -1 });
    console.log('Latest customer:', latestCustomer ? latestCustomer._id : 'Not found');
    
    await mongoose.connection.close();
    
  } catch (error) {
    console.error('Error:', error);
  }
}

quickCheck();
