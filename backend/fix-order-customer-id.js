// Script để fix vấn đề customerId trong orders
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

const orderSchema = new mongoose.Schema({}, { strict: false });
const Order = mongoose.model('Order', orderSchema);

async function fixOrderCustomerId() {
  try {
    console.log('🔧 Fixing Order Customer ID Issue...\n');

    // 1. Kiểm tra orders hiện tại
    const allOrders = await Order.find({});
    console.log(`📦 Total orders in database: ${allOrders.length}`);

    if (allOrders.length === 0) {
      console.log('❌ No orders found in database');
      return;
    }

    // 2. Kiểm tra users và customers
    const totalUsers = await User.countDocuments({ role: 'customer' });
    const totalCustomers = await Customer.countDocuments();
    console.log(`👥 Customer users: ${totalUsers}`);
    console.log(`👤 Customer profiles: ${totalCustomers}`);

    // 3. Tạo mapping từ userId sang customerId
    const customerMapping = new Map();
    const customers = await Customer.find({});
    
    for (const customer of customers) {
      customerMapping.set(customer.userId.toString(), customer._id.toString());
      console.log(`   Mapping: ${customer.userId} -> ${customer._id}`);
    }

    // 4. Kiểm tra orders và customer mapping
    console.log('\n🔍 Checking orders and customer mapping:');
    let fixedCount = 0;
    let errorCount = 0;

    for (const order of allOrders) {
      const currentCustomerId = order.customerId.toString();
      const mappedCustomerId = customerMapping.get(currentCustomerId);
      
      console.log(`\n📦 Order ${order._id}:`);
      console.log(`   Current customerId: ${currentCustomerId}`);
      console.log(`   Mapped customerId: ${mappedCustomerId || 'NOT FOUND'}`);

      if (mappedCustomerId) {
        // Update order với customerId mới
        try {
          await Order.findByIdAndUpdate(order._id, {
            $set: { customerId: new mongoose.Types.ObjectId(mappedCustomerId) }
          });
          console.log(`   ✅ Updated to new customerId: ${mappedCustomerId}`);
          fixedCount++;
        } catch (error) {
          console.log(`   ❌ Error updating order: ${error.message}`);
          errorCount++;
        }
      } else {
        console.log(`   ⚠️  No customer profile found for user ${currentCustomerId}`);
        errorCount++;
      }
    }

    console.log(`\n📊 Fix Summary:`);
    console.log(`   ✅ Successfully fixed: ${fixedCount} orders`);
    console.log(`   ❌ Errors: ${errorCount} orders`);

    // 5. Verify fix
    console.log('\n🔍 Verifying fix...');
    const ordersAfterFix = await Order.find({});
    console.log(`   Total orders after fix: ${ordersAfterFix.length}`);

    // Check if orders can be found by customerId
    for (const customer of customers) {
      const customerOrders = await Order.find({ customerId: customer._id });
      console.log(`   Customer ${customer._id}: ${customerOrders.length} orders`);
    }

  } catch (error) {
    console.error('❌ Fix failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run fix
fixOrderCustomerId();






