import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../user/schemas/user.schema';
import * as bcrypt from 'bcryptjs';

export async function seedUsers() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const userModel = app.get<Model<UserDocument>>('UserModel');
  
  try {
    // Check if users already exist
    const existingUsers = await userModel.countDocuments();
    if (existingUsers > 0) {
      console.log('Users already exist, skipping seed');
      return;
    }

    // Create demo users
    const users = [
      {
        email: 'admin@eatnow.com',
        password: await bcrypt.hash('admin123', 10),
        name: 'Admin User',
        fullName: 'Admin User',
        phone: '0900000001',
        role: 'admin',
        isActive: true,
        isEmailVerified: true,
        isPhoneVerified: true,
        emailVerifiedAt: new Date(),
        phoneVerifiedAt: new Date(),
        addresses: [
          {
            label: 'Văn phòng',
            addressLine: '123 Đường Admin, Quận 1',
            latitude: 10.7769,
            longitude: 106.7009,
            note: 'Tầng 10, tòa nhà Admin',
            isDefault: true,
            city: 'TP. Hồ Chí Minh',
            district: 'Quận 1',
            ward: 'Phường Bến Nghé',
            phone: '0900000001',
            recipientName: 'Admin User',
            isActive: true,
          },
        ],
        language: 'vi',
        country: 'VN',
        timezone: 'Asia/Ho_Chi_Minh',
        currency: 'vietnam_dong',
        allowPushNotifications: true,
        allowEmailNotifications: true,
        allowSMSNotifications: true,
        allowMarketingEmails: true,
        allowLocationTracking: true,
        favoriteCuisines: [],
        dietaryRestrictions: [],
        allergens: [],
        spiceLevel: 0,
        totalOrders: 0,
        totalSpent: 0,
        totalReviews: 0,
        averageOrderValue: 0,
        loyaltyPoints: 0,
        loyaltyTier: 'bronze',
        referralCount: 0,
        referralEarnings: 0,
        failedLoginAttempts: 0,
        passwordHistory: [],
        deviceTokens: [],
        isDeleted: false,
        businessInfo: null,
        driverInfo: null,
      },
      {
        email: 'customer@eatnow.com',
        password: await bcrypt.hash('customer123', 10),
        name: 'Customer Demo',
        fullName: 'Customer Demo',
        phone: '0900000002',
        role: 'customer',
        isActive: true,
        isEmailVerified: true,
        isPhoneVerified: true,
        emailVerifiedAt: new Date(),
        phoneVerifiedAt: new Date(),
        addresses: [
          {
            label: 'Nhà',
            addressLine: '123 Đường Lê Lợi, Quận 1',
            latitude: 10.7769,
            longitude: 106.7009,
            note: 'Tầng 3, căn hộ 301',
            isDefault: true,
            city: 'TP. Hồ Chí Minh',
            district: 'Quận 1',
            ward: 'Phường Bến Nghé',
            phone: '0900000002',
            recipientName: 'Customer Demo',
            isActive: true,
          },
          {
            label: 'Chỗ làm',
            addressLine: '456 Đường Nguyễn Huệ, Quận 1',
            latitude: 10.7756,
            longitude: 106.7008,
            note: 'Tòa nhà ABC, tầng 10',
            isDefault: false,
            city: 'TP. Hồ Chí Minh',
            district: 'Quận 1',
            ward: 'Phường Đa Kao',
            phone: '0900000002',
            recipientName: 'Customer Demo',
            isActive: true,
          },
        ],
        language: 'vi',
        country: 'VN',
        timezone: 'Asia/Ho_Chi_Minh',
        currency: 'vietnam_dong',
        allowPushNotifications: true,
        allowEmailNotifications: true,
        allowSMSNotifications: true,
        allowMarketingEmails: true,
        allowLocationTracking: true,
        favoriteCuisines: ['Pizza', 'Món Việt', 'Đồ ăn nhanh'],
        dietaryRestrictions: [],
        allergens: [],
        spiceLevel: 3,
        totalOrders: 25,
        totalSpent: 2500000,
        totalReviews: 12,
        averageOrderValue: 100000,
        loyaltyPoints: 1250,
        loyaltyTier: 'silver',
        referralCount: 3,
        referralEarnings: 50000,
        failedLoginAttempts: 0,
        passwordHistory: [],
        deviceTokens: [],
        isDeleted: false,
        businessInfo: null,
        driverInfo: null,
      },
      {
        email: 'restaurant@eatnow.com',
        password: await bcrypt.hash('restaurant123', 10),
        name: 'Restaurant Owner',
        fullName: 'Restaurant Owner',
        phone: '0900000003',
        role: 'restaurant',
        isActive: true,
        isEmailVerified: true,
        isPhoneVerified: true,
        emailVerifiedAt: new Date(),
        phoneVerifiedAt: new Date(),
        addresses: [
          {
            label: 'Nhà hàng',
            addressLine: '789 Đường Đồng Khởi, Quận 1',
            latitude: 10.7765,
            longitude: 106.7005,
            note: 'Tầng trệt, mặt tiền',
            isDefault: true,
            city: 'TP. Hồ Chí Minh',
            district: 'Quận 1',
            ward: 'Phường Đa Kao',
            phone: '0900000003',
            recipientName: 'Restaurant Owner',
            isActive: true,
          },
        ],
        language: 'vi',
        country: 'VN',
        timezone: 'Asia/Ho_Chi_Minh',
        currency: 'vietnam_dong',
        allowPushNotifications: true,
        allowEmailNotifications: true,
        allowSMSNotifications: true,
        allowMarketingEmails: true,
        allowLocationTracking: true,
        favoriteCuisines: [],
        dietaryRestrictions: [],
        allergens: [],
        spiceLevel: 0,
        totalOrders: 0,
        totalSpent: 0,
        totalReviews: 0,
        averageOrderValue: 0,
        loyaltyPoints: 0,
        loyaltyTier: 'bronze',
        referralCount: 0,
        referralEarnings: 0,
        failedLoginAttempts: 0,
        passwordHistory: [],
        deviceTokens: [],
        isDeleted: false,
        businessInfo: {
          businessName: 'Demo Restaurant',
          businessLicense: 'BL123456789',
          taxCode: '0123456789',
          businessAddress: '789 Đường Đồng Khởi, Quận 1',
          businessPhone: '0900000003',
          businessEmail: 'restaurant@eatnow.com',
          website: 'https://demo-restaurant.com',
          description: 'Nhà hàng demo với nhiều món ăn ngon',
        },
        driverInfo: null,
      },
      {
        email: 'driver@eatnow.com',
        password: await bcrypt.hash('driver123', 10),
        name: 'Driver Demo',
        fullName: 'Driver Demo',
        phone: '0900000004',
        role: 'driver',
        isActive: true,
        isEmailVerified: true,
        isPhoneVerified: true,
        emailVerifiedAt: new Date(),
        phoneVerifiedAt: new Date(),
        addresses: [
          {
            label: 'Nhà',
            addressLine: '321 Đường Pasteur, Quận 3',
            latitude: 10.7829,
            longitude: 106.6899,
            note: 'Tầng 2, căn hộ 205',
            isDefault: true,
            city: 'TP. Hồ Chí Minh',
            district: 'Quận 3',
            ward: 'Phường Võ Thị Sáu',
            phone: '0900000004',
            recipientName: 'Driver Demo',
            isActive: true,
          },
        ],
        language: 'vi',
        country: 'VN',
        timezone: 'Asia/Ho_Chi_Minh',
        currency: 'vietnam_dong',
        allowPushNotifications: true,
        allowEmailNotifications: true,
        allowSMSNotifications: true,
        allowMarketingEmails: true,
        allowLocationTracking: true,
        favoriteCuisines: [],
        dietaryRestrictions: [],
        allergens: [],
        spiceLevel: 0,
        totalOrders: 0,
        totalSpent: 0,
        totalReviews: 0,
        averageOrderValue: 0,
        loyaltyPoints: 0,
        loyaltyTier: 'bronze',
        referralCount: 0,
        referralEarnings: 0,
        failedLoginAttempts: 0,
        passwordHistory: [],
        deviceTokens: [],
        isDeleted: false,
        businessInfo: null,
        driverInfo: {
          licenseNumber: 'DL123456789',
          vehicleType: 'motorcycle',
          vehicleModel: 'Honda Wave RSX',
          licensePlate: '51A-12345',
          bankAccount: '1234567890',
          bankName: 'Vietcombank',
          isAvailable: true,
        },
      },
    ];

    // Insert users
    await userModel.insertMany(users);
    console.log(`✅ Seeded ${users.length} users successfully`);
    
    // Log created users
    users.forEach(user => {
      console.log(`👤 Created ${user.role}: ${user.email} (password: ${user.role}123)`);
    });

  } catch (error) {
    console.error('❌ Error seeding users:', error);
  } finally {
    await app.close();
  }
}

// Run if called directly
if (require.main === module) {
  seedUsers()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Seed failed:', error);
      process.exit(1);
    });
}
