// Debug script để kiểm tra orders
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/eatnow', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const orderSchema = new mongoose.Schema({}, { strict: false });
const Order = mongoose.model('Order', orderSchema);

async function debugOrders() {
  try {
    console.log('🔍 Debugging Orders...\n');

    // 1. Tìm đơn hàng cụ thể
    const specificOrder = await Order.findById('68cda6f21b66ca8247899887');
    if (specificOrder) {
      console.log('📦 Specific Order Found:');
      console.log('- Order ID:', specificOrder._id);
      console.log('- Customer ID:', specificOrder.customerId);
      console.log('- Restaurant ID:', specificOrder.restaurantId);
      console.log('- Status:', specificOrder.status);
      console.log('- Total:', specificOrder.finalTotal);
      console.log('- Created:', specificOrder.createdAt);
    } else {
      console.log('❌ Specific Order NOT Found');
    }
    console.log('');

    // 2. Tìm tất cả orders của customer này
    const customerOrders = await Order.find({ 
      customerId: '68ccee0dfdd7a3847f76abf0' 
    }).sort({ createdAt: -1 });
    
    console.log('👤 All Orders for Customer 68ccee0dfdd7a3847f76abf0:');
    console.log('- Count:', customerOrders.length);
    customerOrders.forEach((order, index) => {
      console.log(`  ${index + 1}. Order ID: ${order._id}`);
      console.log(`     Status: ${order.status}`);
      console.log(`     Total: ${order.finalTotal}đ`);
      console.log(`     Created: ${order.createdAt}`);
    });
    console.log('');

    // 3. Tìm tất cả orders trong database
    const allOrders = await Order.find({}).sort({ createdAt: -1 }).limit(10);
    console.log('🗄️ All Orders in Database (last 10):');
    console.log('- Total count:', await Order.countDocuments());
    allOrders.forEach((order, index) => {
      console.log(`  ${index + 1}. Order ID: ${order._id}`);
      console.log(`     Customer ID: ${order.customerId}`);
      console.log(`     Status: ${order.status}`);
      console.log(`     Total: ${order.finalTotal}đ`);
      console.log(`     Created: ${order.createdAt}`);
    });
    console.log('');

    // 4. Kiểm tra users
    const userSchema = new mongoose.Schema({}, { strict: false });
    const User = mongoose.model('User', userSchema);
    
    const users = await User.find({}).limit(5);
    console.log('👥 Users in Database:');
    users.forEach((user, index) => {
      console.log(`  ${index + 1}. User ID: ${user._id}`);
      console.log(`     Email: ${user.email || 'N/A'}`);
      console.log(`     Role: ${user.role || 'N/A'}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

debugOrders();
