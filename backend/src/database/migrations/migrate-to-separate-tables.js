// Migration script to separate user data into role-specific tables
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

async function migrateToSeparateTables() {
  try {
    console.log('🚀 Starting migration to separate tables...\n');

    // 1. Get all users with customer role
    const customerUsers = await User.find({ role: 'customer' });
    console.log(`📊 Found ${customerUsers.length} customer users`);

    let migratedCount = 0;
    let errorCount = 0;

    for (const user of customerUsers) {
      try {
        console.log(`\n👤 Processing user: ${user.email} (${user._id})`);

        // Check if customer profile already exists
        const existingCustomer = await Customer.findOne({ userId: user._id });
        if (existingCustomer) {
          console.log(`   ⚠️  Customer profile already exists, skipping...`);
          continue;
        }

        // Create customer profile
        const customerData = {
          userId: user._id,
          name: user.name,
          fullName: user.fullName,
          phone: user.phone,
          avatarUrl: user.avatarUrl,
          avatarId: user.avatarId,
          dateOfBirth: user.dateOfBirth,
          gender: user.gender,
          bio: user.bio,
          addresses: user.addresses || [],
          addressLabels: user.addressLabels || ['Nhà', 'Chỗ làm', 'Nhà bạn', 'Khác'],
          isActive: user.isActive,
          isPhoneVerified: user.isPhoneVerified,
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
        await User.findByIdAndUpdate(user._id, {
          $set: {
            customerProfile: customer._id
          },
          $unset: {
            addresses: 1,
            addressLabels: 1,
            favoriteCuisines: 1,
            dietaryRestrictions: 1,
            allergens: 1,
            spiceLevel: 1,
            totalOrders: 1,
            totalSpent: 1,
            totalReviews: 1,
            averageOrderValue: 1,
            loyaltyPoints: 1,
            loyaltyTier: 1,
            referredBy: 1,
            referralCount: 1,
            referralEarnings: 1,
          }
        });

        migratedCount++;
        console.log(`   ✅ Migrated successfully`);

      } catch (error) {
        errorCount++;
        console.log(`   ❌ Error migrating user ${user.email}:`, error.message);
      }
    }

    console.log(`\n📊 Migration Summary:`);
    console.log(`   ✅ Successfully migrated: ${migratedCount} customers`);
    console.log(`   ❌ Errors: ${errorCount} customers`);
    console.log(`   📈 Total processed: ${customerUsers.length} customers`);

    // 2. Verify migration
    console.log(`\n🔍 Verifying migration...`);
    const totalCustomers = await Customer.countDocuments();
    const customersWithProfiles = await User.countDocuments({ 
      role: 'customer', 
      customerProfile: { $exists: true } 
    });
    
    console.log(`   📊 Total customers in Customer collection: ${totalCustomers}`);
    console.log(`   📊 Users with customer profiles: ${customersWithProfiles}`);

    if (totalCustomers === customersWithProfiles) {
      console.log(`   ✅ Migration verification successful!`);
    } else {
      console.log(`   ⚠️  Migration verification failed - counts don't match`);
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run migration
migrateToSeparateTables();
