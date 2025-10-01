// Check users in database
const mongoose = require('mongoose');

async function checkUsers() {
  try {
    await mongoose.connect('mongodb://localhost:27017/eatnow');
    
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const Customer = mongoose.model('Customer', new mongoose.Schema({}, { strict: false }));
    
    // Get all users
    const users = await User.find().limit(5);
    console.log('👥 Users in database:');
    users.forEach(user => {
      console.log(`   ${user.email} - ${user.role} (${user._id})`);
    });
    
    // Get all customers
    const customers = await Customer.find().limit(5);
    console.log('\n👤 Customers in database:');
    customers.forEach(customer => {
      console.log(`   ${customer.name} - ${customer.userId} (${customer._id})`);
    });
    
    await mongoose.connection.close();
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkUsers();