# 🏗️ Database Restructure Guide - 5 Bảng Riêng Biệt

## 📋 **Tổng Quan**

Dự án đã được tái cấu trúc để sử dụng 5 bảng chính riêng biệt:

1. **`users`** - Thông tin chung (authentication, profile cơ bản)
2. **`customers`** - Thông tin khách hàng (addresses, preferences, stats)
3. **`restaurants`** - Thông tin nhà hàng (đã có sẵn)
4. **`drivers`** - Thông tin tài xế (đã có sẵn)
5. **`admins`** - Thông tin admin (đã có sẵn)

## 🎯 **Lý Do Tái Cấu Trúc**

### **Trước Đây:**
- Tất cả thông tin lưu trong bảng `users`
- Schema quá lớn và phức tạp
- Khó maintain và scale
- Dữ liệu không được tối ưu

### **Sau Khi Tái Cấu Trúc:**
- **Tách biệt rõ ràng** theo vai trò
- **Schema nhỏ gọn** và dễ hiểu
- **Performance tốt hơn** với indexes riêng
- **Dễ mở rộng** và thêm tính năng mới

## 📊 **Cấu Trúc Mới**

### **1. Bảng `users` (Thông tin chung)**
```typescript
{
  _id: ObjectId,
  email: string,           // Unique
  password: string,
  name: string,
  fullName?: string,
  phone?: string,
  avatarUrl?: string,
  avatarId?: ObjectId,
  role: 'customer' | 'restaurant' | 'driver' | 'admin',
  
  // Basic info
  dateOfBirth?: Date,
  gender?: 'male' | 'female' | 'other',
  bio?: string,
  
  // Account status
  isActive: boolean,
  isEmailVerified: boolean,
  isPhoneVerified: boolean,
  lastLoginAt?: Date,
  lastActiveAt?: Date,
  
  // Basic preferences
  language: string,
  country: string,
  timezone?: string,
  currency: string,
  allowPushNotifications: boolean,
  allowEmailNotifications: boolean,
  allowSMSNotifications: boolean,
  allowMarketingEmails: boolean,
  allowLocationTracking: boolean,
  
  // Security
  failedLoginAttempts: number,
  lockedUntil?: Date,
  passwordChangedAt?: Date,
  passwordHistory: string[],
  
  // Device management
  deviceTokens: string[],
  lastDeviceInfo?: object,
  
  // Privacy
  isDeleted: boolean,
  deletedAt?: Date,
  dataRetentionUntil?: Date,
  
  // References to role-specific collections
  customerProfile?: ObjectId,    // Reference to customers collection
  restaurantProfile?: ObjectId,  // Reference to restaurants collection
  driverProfile?: ObjectId,      // Reference to drivers collection
  adminProfile?: ObjectId,       // Reference to admins collection
}
```

### **2. Bảng `customers` (Thông tin khách hàng)**
```typescript
{
  _id: ObjectId,
  userId: ObjectId,        // Reference to users collection
  
  // Personal info
  name: string,
  fullName?: string,
  phone?: string,
  avatarUrl?: string,
  avatarId?: ObjectId,
  dateOfBirth?: Date,
  gender?: 'male' | 'female' | 'other',
  bio?: string,
  
  // Address management
  addresses: [{
    label: string,
    addressLine: string,
    latitude: number,
    longitude: number,
    note?: string,
    isDefault: boolean,
    city?: string,
    district?: string,
    ward?: string,
    phone?: string,
    recipientName?: string,
    isActive: boolean,
  }],
  addressLabels: string[],
  
  // Account status
  isActive: boolean,
  isPhoneVerified: boolean,
  phoneVerifiedAt?: Date,
  lastLoginAt?: Date,
  lastActiveAt?: Date,
  
  // Preferences
  language: string,
  country: string,
  timezone?: string,
  currency: string,
  allowPushNotifications: boolean,
  allowEmailNotifications: boolean,
  allowSMSNotifications: boolean,
  allowMarketingEmails: boolean,
  allowLocationTracking: boolean,
  
  // Food preferences
  favoriteCuisines: string[],
  dietaryRestrictions: string[],
  allergens: string[],
  spiceLevel: number, // 0-5
  
  // Order statistics
  totalOrders: number,
  totalSpent: number,
  totalReviews: number,
  averageOrderValue: number,
  loyaltyPoints: number,
  loyaltyTier: 'bronze' | 'silver' | 'gold' | 'platinum',
  
  // Referral system
  referredBy?: ObjectId,
  referralCount: number,
  referralEarnings: number,
  
  // Security
  failedLoginAttempts: number,
  lockedUntil?: Date,
  passwordChangedAt?: Date,
  passwordHistory: string[],
  
  // Device management
  deviceTokens: string[],
  lastDeviceInfo?: object,
  
  // Privacy
  isDeleted: boolean,
  deletedAt?: Date,
  dataRetentionUntil?: Date,
  
  // Customer specific
  preferences?: {
    favoriteRestaurants: ObjectId[],
    favoriteItems: ObjectId[],
    preferredDeliveryTime?: string,
    preferredPaymentMethod?: string,
    deliveryInstructions?: string,
  },
  
  socialInfo?: {
    facebookId?: string,
    googleId?: string,
    appleId?: string,
    linkedInId?: string,
  },
  
  subscriptionInfo?: {
    isSubscribed: boolean,
    subscriptionType?: string,
    subscriptionStartDate?: Date,
    subscriptionEndDate?: Date,
    autoRenew: boolean,
  },
  
  analytics?: {
    lastOrderDate?: Date,
    favoriteOrderTime?: string,
    averageOrderFrequency?: number,
    totalDeliveryFees?: number,
    totalServiceFees?: number,
    totalDiscounts?: number,
    cancellationRate?: number,
  },
  
  orderHistory: [{
    orderId: ObjectId,
    restaurantId: ObjectId,
    totalAmount: number,
    orderDate: Date,
    status: string,
    rating?: number,
  }],
  
  favoriteRestaurants: [{
    restaurantId: ObjectId,
    addedAt: Date,
    orderCount: number,
    lastOrderDate?: Date,
  }],
  
  favoriteItems: [{
    itemId: ObjectId,
    restaurantId: ObjectId,
    addedAt: Date,
    orderCount: number,
    lastOrderDate?: Date,
  }],
}
```

## 🔧 **API Endpoints Mới**

### **Customer Endpoints:**
```
GET    /api/v1/customer/profile          - Lấy thông tin khách hàng
PUT    /api/v1/customer/profile          - Cập nhật thông tin khách hàng
GET    /api/v1/customer/stats            - Lấy thống kê khách hàng

POST   /api/v1/customer/addresses        - Thêm địa chỉ
PUT    /api/v1/customer/addresses/:index - Cập nhật địa chỉ
DELETE /api/v1/customer/addresses/:index - Xóa địa chỉ

POST   /api/v1/customer/favorites/restaurants/:id - Thêm nhà hàng yêu thích
DELETE /api/v1/customer/favorites/restaurants/:id - Xóa nhà hàng yêu thích
POST   /api/v1/customer/favorites/items/:id       - Thêm món yêu thích
DELETE /api/v1/customer/favorites/items/:id       - Xóa món yêu thích

GET    /api/v1/customer/restaurants      - Lấy danh sách nhà hàng (public)
```

## 🚀 **Migration Process**

### **Bước 1: Chạy Migration Script**
```bash
cd backend
node src/database/migrations/migrate-to-separate-tables.js
```

### **Bước 2: Kiểm tra Migration**
```bash
node test-new-structure.js
```

### **Bước 3: Test API**
```bash
# Start backend
npm run start:dev

# Test customer endpoints
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3001/api/v1/customer/profile
```

## 📁 **Files Đã Tạo/Cập Nhật**

### **Mới:**
- `backend/src/customer/schemas/customer.schema.ts` - Customer schema
- `backend/src/customer/customer.service.ts` - Customer service
- `backend/src/customer/customer.controller.ts` - Customer controller (updated)
- `backend/src/customer/customer.module.ts` - Customer module (updated)
- `backend/src/database/migrations/migrate-to-separate-tables.js` - Migration script
- `backend/test-new-structure.js` - Test script

### **Cập nhật:**
- `backend/src/user/schemas/user.schema.ts` - User schema (simplified)
- `backend/src/app.module.ts` - App module (already has CustomerModule)

## 🔍 **Kiểm Tra Migration**

### **1. Kiểm tra dữ liệu:**
```javascript
// Trong MongoDB shell
db.users.find({role: "customer", customerProfile: {$exists: true}}).count()
db.customers.count()
```

### **2. Kiểm tra API:**
```bash
# Test customer profile
curl -H "Authorization: Bearer TOKEN" http://localhost:3001/api/v1/customer/profile

# Test customer stats
curl -H "Authorization: Bearer TOKEN" http://localhost:3001/api/v1/customer/stats
```

## ⚠️ **Lưu Ý Quan Trọng**

1. **Backup database** trước khi chạy migration
2. **Test kỹ** trên môi trường development trước
3. **Cập nhật frontend** để sử dụng API mới
4. **Kiểm tra** tất cả tính năng hoạt động đúng

## 🎯 **Lợi Ích**

1. **Performance tốt hơn** - Indexes riêng cho từng bảng
2. **Dễ maintain** - Schema rõ ràng, tách biệt
3. **Scalable** - Dễ mở rộng thêm tính năng
4. **Clean code** - Service và controller riêng biệt
5. **Data integrity** - References rõ ràng giữa các bảng

## 🔄 **Next Steps**

1. **Chạy migration** để chuyển dữ liệu
2. **Test API** mới
3. **Cập nhật frontend** để sử dụng endpoints mới
4. **Tạo tương tự** cho restaurants, drivers, admins
5. **Clean up** code cũ không cần thiết

**Database structure mới đã sẵn sàng! 🚀**






