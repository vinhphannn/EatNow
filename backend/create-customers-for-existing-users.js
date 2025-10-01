// Script để tạo customer profiles cho tất cả users hiện tại
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

async function createCustomersForExistingUsers() {
  try {
    console.log('🔧 Creating Customer Profiles for Existing Users...\n');

    // 1. Lấy tất cả users với role customer
    const customerUsers = await User.find({ role: 'customer' });
    console.log(`👥 Found ${customerUsers.length} customer users`);

    let createdCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const user of customerUsers) {
      try {
        console.log(`\n👤 Processing user: ${user.email} (${user._id})`);

        // Check if customer profile already exists
        const existingCustomer = await Customer.findOne({ userId: user._id });
        if (existingCustomer) {
          console.log(`   ⚠️  Customer profile already exists, skipping...`);
          skippedCount++;
          continue;
        }

        // Create customer profile
        const customerData = {
          userId: user._id,
          name: user.name || 'Unknown',
          fullName: user.fullName || user.name || 'Unknown',
          phone: user.phone,
          avatarUrl: user.avatarUrl,
          avatarId: user.avatarId,
          dateOfBirth: user.dateOfBirth,
          gender: user.gender,
          bio: user.bio,
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
          addresses: user.addresses || [],
          addressLabels: user.addressLabels || ['Nhà', 'Chỗ làm', 'Nhà bạn', 'Khác'],
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
        await User.findByIdAndUpdate(user._id, {
          $set: { customerProfile: customer._id }
        });

        createdCount++;
        console.log(`   ✅ Created customer profile: ${customer._id}`);

      } catch (error) {
        errorCount++;
        console.log(`   ❌ Error creating customer profile for ${user.email}: ${error.message}`);
      }
    }

    console.log(`\n📊 Creation Summary:`);
    console.log(`   ✅ Successfully created: ${createdCount} customer profiles`);
    console.log(`   ⚠️  Skipped (already exists): ${skippedCount} customer profiles`);
    console.log(`   ❌ Errors: ${errorCount} customer profiles`);
    console.log(`   📈 Total processed: ${customerUsers.length} users`);

    // 2. Verify creation
    console.log(`\n🔍 Verifying creation...`);
    const totalCustomers = await Customer.countDocuments();
    const customersWithProfiles = await User.countDocuments({ 
      role: 'customer', 
      customerProfile: { $exists: true } 
    });
    
    console.log(`   📊 Total customers: ${totalCustomers}`);
    console.log(`   📊 Users with customer profiles: ${customersWithProfiles}`);

    if (totalCustomers === customersWithProfiles) {
      console.log(`   ✅ All customer users now have profiles!`);
    } else {
      console.log(`   ⚠️  Some users still missing customer profiles`);
    }

  } catch (error) {
    console.error('❌ Creation failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

createCustomersForExistingUsers();






