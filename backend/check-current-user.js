// Script để kiểm tra user hiện tại
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/eatnow');

const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', userSchema);

const orderSchema = new mongoose.Schema({}, { strict: false });
const Order = mongoose.model('Order', orderSchema);

async function checkCurrentUser() {
  try {
    console.log('🔍 Checking Current User and Orders...\n');

    // 1. Liệt kê tất cả users
    const users = await User.find({ role: 'customer' });
    console.log('👥 All Customer Users:');
    users.forEach((user, index) => {
      console.log(`  ${index + 1}. User ID: ${user._id}`);
      console.log(`     Email: ${user.email}`);
      console.log(`     Name: ${user.name || 'N/A'}`);
      console.log(`     Role: ${user.role}`);
      console.log('');
    });

    // 2. Kiểm tra orders cho từng user
    for (const user of users) {
      const userOrders = await Order.find({ customerId: user._id });
      console.log(`📦 Orders for User ${user.email} (${user._id}):`);
      console.log(`   Count: ${userOrders.length}`);
      
      if (userOrders.length > 0) {
        userOrders.forEach((order, index) => {
          console.log(`   ${index + 1}. Order ID: ${order._id}`);
          console.log(`      Status: ${order.status}`);
          console.log(`      Total: ${order.finalTotal}đ`);
          console.log(`      Created: ${order.createdAt}`);
        });
      }
      console.log('');
    }

    // 3. Kiểm tra đơn hàng cụ thể
    console.log('🔍 Looking for specific order...');
    const allOrders = await Order.find({});
    console.log(`Total orders in database: ${allOrders.length}`);
    
    allOrders.forEach((order, index) => {
      console.log(`  ${index + 1}. Order ID: ${order._id}`);
      console.log(`     Customer ID: ${order.customerId}`);
      console.log(`     Status: ${order.status}`);
      console.log(`     Total: ${order.finalTotal}đ`);
      console.log(`     Created: ${order.createdAt}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkCurrentUser();






