// Test script for new database structure
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

async function testNewStructure() {
  try {
    console.log('🔍 Testing New Database Structure...\n');

    // 1. Check users
    const totalUsers = await User.countDocuments();
    const customerUsers = await User.countDocuments({ role: 'customer' });
    const usersWithCustomerProfile = await User.countDocuments({ 
      role: 'customer', 
      customerProfile: { $exists: true } 
    });

    console.log('👥 Users:');
    console.log(`   Total users: ${totalUsers}`);
    console.log(`   Customer users: ${customerUsers}`);
    console.log(`   Users with customer profiles: ${usersWithCustomerProfile}`);

    // 2. Check customers
    const totalCustomers = await Customer.countDocuments();
    console.log(`\n👤 Customers: ${totalCustomers}`);

    // 3. Sample data
    console.log('\n📋 Sample User (with customer profile):');
    const sampleUser = await User.findOne({ 
      role: 'customer', 
      customerProfile: { $exists: true } 
    }).populate('customerProfile');
    
    if (sampleUser) {
      console.log(`   Email: ${sampleUser.email}`);
      console.log(`   Name: ${sampleUser.name}`);
      console.log(`   Role: ${sampleUser.role}`);
      console.log(`   Customer Profile ID: ${sampleUser.customerProfile?._id}`);
      console.log(`   Has addresses: ${sampleUser.customerProfile?.addresses?.length || 0}`);
      console.log(`   Total orders: ${sampleUser.customerProfile?.totalOrders || 0}`);
    } else {
      console.log('   No users with customer profiles found');
    }

    // 4. Check data integrity
    console.log('\n🔍 Data Integrity Check:');
    
    // Find users without customer profiles
    const usersWithoutProfiles = await User.find({ 
      role: 'customer', 
      customerProfile: { $exists: false } 
    });
    
    console.log(`   Users without customer profiles: ${usersWithoutProfiles.length}`);
    
    if (usersWithoutProfiles.length > 0) {
      console.log('   Users that need migration:');
      usersWithoutProfiles.forEach(user => {
        console.log(`     - ${user.email} (${user._id})`);
      });
    }

    // Find orphaned customer profiles
    const orphanedCustomers = await Customer.find({
      userId: { $nin: (await User.find({ role: 'customer' })).map(u => u._id) }
    });
    
    console.log(`   Orphaned customer profiles: ${orphanedCustomers.length}`);

    // 5. Test customer service methods
    console.log('\n🧪 Testing Customer Service Methods:');
    
    if (sampleUser) {
      try {
        // Test getCustomerByUserId
        const customer = await Customer.findOne({ userId: sampleUser._id });
        if (customer) {
          console.log('   ✅ getCustomerByUserId works');
          console.log(`     Customer name: ${customer.name}`);
          console.log(`     Addresses: ${customer.addresses?.length || 0}`);
        }

        // Test getCustomerStats
        const stats = {
          totalOrders: customer.totalOrders || 0,
          totalSpent: customer.totalSpent || 0,
          loyaltyPoints: customer.loyaltyPoints || 0,
        };
        console.log('   ✅ getCustomerStats works');
        console.log(`     Stats:`, stats);

      } catch (error) {
        console.log('   ❌ Error testing customer service:', error.message);
      }
    }

    console.log('\n✅ Structure test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

testNewStructure();






