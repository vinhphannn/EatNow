// Check user passwords
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

async function checkPasswords() {
  try {
    await mongoose.connect('mongodb://localhost:27017/eatnow');
    
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    
    // Get all users
    const users = await User.find().limit(5);
    console.log('👥 Users and password hashes:');
    
    for (const user of users) {
      console.log(`\n${user.email}:`);
      console.log(`  Password hash: ${user.password?.substring(0, 20)}...`);
      console.log(`  Role: ${user.role}`);
      
      // Test common passwords
      const testPasswords = ['password123', '123456', 'password', 'admin123'];
      for (const testPass of testPasswords) {
        try {
          const isValid = await bcrypt.compare(testPass, user.password);
          if (isValid) {
            console.log(`  ✅ Password '${testPass}' is valid`);
            break;
          }
        } catch (e) {
          // Ignore bcrypt errors
        }
      }
    }
    
    await mongoose.connection.close();
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkPasswords();




