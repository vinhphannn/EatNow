// Script để tạo customer profiles cho những user bị thiếu
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

async function createMissingCustomers() {
  try {
    console.log('🔧 Creating Missing Customer Profiles...\n');

    // 1. Lấy tất cả orders và tìm customerId unique
    const allOrders = await Order.find({});
    const uniqueCustomerIds = [...new Set(allOrders.map(order => order.customerId.toString()))];
    
    console.log(`📦 Found ${allOrders.length} orders with ${uniqueCustomerIds.length} unique customer IDs`);
    console.log('Customer IDs in orders:', uniqueCustomerIds);

    // 2. Kiểm tra xem customerId nào chưa có customer profile
    const existingCustomers = await Customer.find({});
    const existingCustomerUserIds = existingCustomers.map(c => c.userId.toString());
    
    console.log(`\n👤 Existing customer profiles: ${existingCustomers.length}`);
    console.log('Existing customer user IDs:', existingCustomerUserIds);

    // 3. Tìm customerId nào cần tạo customer profile
    const missingCustomerIds = uniqueCustomerIds.filter(id => !existingCustomerUserIds.includes(id));
    console.log(`\n❌ Missing customer profiles for: ${missingCustomerIds.length} users`);
    console.log('Missing customer IDs:', missingCustomerIds);

    // 4. Tạo customer profiles cho những user bị thiếu
    let createdCount = 0;
    let errorCount = 0;

    for (const customerId of missingCustomerIds) {
      try {
        console.log(`\n👤 Creating customer profile for user: ${customerId}`);
        
        // Tìm user với ID này
        const user = await User.findById(customerId);
        if (!user) {
          console.log(`   ❌ User ${customerId} not found in users collection`);
          errorCount++;
          continue;
        }

        // Tạo customer profile
        const customerData = {
          userId: new mongoose.Types.ObjectId(customerId),
          name: user.name || 'Unknown',
          fullName: user.fullName,
          phone: user.phone,
          avatarUrl: user.avatarUrl,
          avatarId: user.avatarId,
          dateOfBirth: user.dateOfBirth,
          gender: user.gender,
          bio: user.bio,
          addresses: user.addresses || [],
          addressLabels: user.addressLabels || ['Nhà', 'Chỗ làm', 'Nhà bạn', 'Khác'],
          isActive: user.isActive !== false,
          isPhoneVerified: user.isPhoneVerified || false,
          phoneVerifiedAt: user.phoneVerifiedAt,
          lastLoginAt: user.lastLoginAt,
          lastActiveAt: user.lastActiveAt,
          language: user.language || 'vi',
          country: user.country || 'VN',
          timezone: user.timezone,
          currency: user.currency || 'vietnam_dong',
          allowPushNotifications: user.allowPushNotifications !== false,
          allowEmailNotifications: user.allowEmailNotifications !== false,
          allowSMSNotifications: user.allowSMSNotifications || false,
          allowMarketingEmails: user.allowMarketingEmails !== false,
          allowLocationTracking: user.allowLocationTracking !== false,
          favoriteCuisines: user.favoriteCuisines || [],
          dietaryRestrictions: user.dietaryRestrictions || [],
          allergens: user.allergens || [],
          spiceLevel: user.spiceLevel || 0,
          totalOrders: user.totalOrders || 0,
          totalSpent: user.totalSpent || 0,
          totalReviews: user.totalReviews || 0,
          averageOrderValue: user.averageOrderValue || 0,
          loyaltyPoints: user.loyaltyPoints || 0,
          loyaltyTier: user.loyaltyTier || 'bronze',
          referredBy: user.referredBy,
          referralCount: user.referralCount || 0,
          referralEarnings: user.referralEarnings || 0,
          failedLoginAttempts: user.failedLoginAttempts || 0,
          lockedUntil: user.lockedUntil,
          passwordChangedAt: user.passwordChangedAt,
          passwordHistory: user.passwordHistory || [],
          deviceTokens: user.deviceTokens || [],
          lastDeviceInfo: user.lastDeviceInfo,
          isDeleted: user.isDeleted || false,
          deletedAt: user.deletedAt,
          dataRetentionUntil: user.dataRetentionUntil,
          preferences: {
            favoriteRestaurants: [],
            favoriteItems: [],
            preferredDeliveryTime: null,
            preferredPaymentMethod: null,
            deliveryInstructions: null,
          },
          socialInfo: {
            facebookId: user.socialInfo?.facebookId,
            googleId: user.socialInfo?.googleId,
            appleId: user.socialInfo?.appleId,
            linkedInId: user.socialInfo?.linkedInId,
          },
          subscriptionInfo: {
            isSubscribed: false,
            subscriptionType: null,
            subscriptionStartDate: null,
            subscriptionEndDate: null,
            autoRenew: false,
          },
          analytics: {
            lastOrderDate: null,
            favoriteOrderTime: null,
            averageOrderFrequency: 0,
            totalDeliveryFees: 0,
            totalServiceFees: 0,
            totalDiscounts: 0,
            cancellationRate: 0,
          },
          orderHistory: [],
          favoriteRestaurants: [],
          favoriteItems: [],
        };

        const customer = new Customer(customerData);
        await customer.save();

        // Update user to reference customer profile
        await User.findByIdAndUpdate(customerId, {
          $set: { customerProfile: customer._id }
        });

        createdCount++;
        console.log(`   ✅ Created customer profile: ${customer._id}`);

      } catch (error) {
        errorCount++;
        console.log(`   ❌ Error creating customer profile for ${customerId}: ${error.message}`);
      }
    }

    console.log(`\n📊 Creation Summary:`);
    console.log(`   ✅ Successfully created: ${createdCount} customer profiles`);
    console.log(`   ❌ Errors: ${errorCount} customer profiles`);

    // 5. Verify creation
    console.log(`\n🔍 Verifying creation...`);
    const totalCustomers = await Customer.countDocuments();
    const customersWithProfiles = await User.countDocuments({ 
      role: 'customer', 
      customerProfile: { $exists: true } 
    });
    
    console.log(`   📊 Total customers: ${totalCustomers}`);
    console.log(`   📊 Users with customer profiles: ${customersWithProfiles}`);

    // 6. Test order lookup
    console.log(`\n🧪 Testing order lookup...`);
    for (const customerId of uniqueCustomerIds) {
      const customer = await Customer.findOne({ userId: new mongoose.Types.ObjectId(customerId) });
      if (customer) {
        const orders = await Order.find({ customerId: customer._id });
        console.log(`   Customer ${customerId}: ${orders.length} orders`);
      } else {
        console.log(`   Customer ${customerId}: NOT FOUND`);
      }
    }

  } catch (error) {
    console.error('❌ Creation failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

createMissingCustomers();






