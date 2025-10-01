const mongoose = require('mongoose');
require('dotenv').config();

// Define Restaurant schema
const restaurantSchema = new mongoose.Schema({
  ownerUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  description: String,
  address: String,
  imageUrl: String,
  imageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Image' },
  
  // Business info
  businessLicense: String,
  taxCode: String,
  phone: String,
  email: String,
  website: String,
  
  // Location
  latitude: Number,
  longitude: Number,
  city: String,
  district: String,
  ward: String,
  
  // Operating hours
  openDays: { type: [Number], default: [0, 1, 2, 3, 4, 5, 6] },
  openTime: { type: String, default: '08:00' },
  closeTime: { type: String, default: '22:00' },
  
  // Status and settings
  status: { type: String, enum: ['pending', 'active', 'suspended', 'closed'], default: 'pending' },
  isOpen: { type: Boolean, default: true },
  isAcceptingOrders: { type: Boolean, default: true },
  isDeliveryAvailable: { type: Boolean, default: true },
  isPickupAvailable: { type: Boolean, default: false },
  
  // Performance metrics
  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0 },
  orderCount: { type: Number, default: 0 },
  totalRevenue: { type: Number, default: 0 },
  
  // Delivery settings
  deliveryTime: { type: String, default: '30-45 phút' },
  deliveryFee: { type: Number, default: 0 },
  minOrderAmount: { type: Number, default: 50000 },
  freeDeliveryThreshold: { type: Number, default: 10000 },
  maxDeliveryDistance: { type: Number, default: 5000 },
  
  // Category and tags
  category: String,
  tags: { type: [String], default: [] },
  
  // Social and marketing
  followersCount: { type: Number, default: 0 },
  likesCount: { type: Number, default: 0 },
  sharesCount: { type: Number, default: 0 },
  
  // Verification and compliance
  isVerified: { type: Boolean, default: false },
  isPremium: { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false },
  joinedAt: { type: Date, default: Date.now },
  verifiedAt: Date,
  
  // Analytics and tracking
  viewCount: { type: Number, default: 0 },
  clickCount: { type: Number, default: 0 },
  conversionRate: { type: Number, default: 0 },
  
  // Settings
  autoAcceptOrders: { type: Boolean, default: true },
  preparationTime: { type: Number, default: 15 },
  allowSpecialRequests: { type: Boolean, default: true },
  allowCustomization: { type: Boolean, default: true },
}, { timestamps: true });

const Restaurant = mongoose.model('Restaurant', restaurantSchema);

// Seed data for restaurants
const seedRestaurants = [
  {
    ownerUserId: new mongoose.Types.ObjectId(), // Will be replaced with actual user ID
    name: 'Pizza Hut',
    description: 'Nhà hàng pizza nổi tiếng thế giới với hương vị đặc trưng',
    address: '123 Đường Lê Lợi, Quận 1, TP.HCM',
    imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400',
    phone: '028 1234 5678',
    email: 'pizzahut@example.com',
    city: 'TP. Hồ Chí Minh',
    district: 'Quận 1',
    ward: 'Phường Bến Nghé',
    latitude: 10.7769,
    longitude: 106.7009,
    status: 'active',
    isOpen: true,
    isVerified: true,
    isFeatured: true,
    rating: 4.5,
    reviewCount: 128,
    orderCount: 245,
    deliveryTime: '25-35 phút',
    deliveryFee: 15000,
    minOrderAmount: 80000,
    category: 'Pizza',
    tags: ['pizza', 'italian', 'family'],
    businessLicense: 'BL001',
    taxCode: 'TC001',
  },
  {
    ownerUserId: new mongoose.Types.ObjectId(),
    name: 'KFC',
    description: 'Gà rán KFC với công thức độc quyền, giòn tan bên ngoài',
    address: '456 Đường Nguyễn Huệ, Quận 1, TP.HCM',
    imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400',
    phone: '028 2345 6789',
    email: 'kfc@example.com',
    city: 'TP. Hồ Chí Minh',
    district: 'Quận 1',
    ward: 'Phường Đa Kao',
    latitude: 10.7756,
    longitude: 106.7008,
    status: 'active',
    isOpen: true,
    isVerified: true,
    isFeatured: true,
    rating: 4.3,
    reviewCount: 89,
    orderCount: 156,
    deliveryTime: '20-30 phút',
    deliveryFee: 12000,
    minOrderAmount: 60000,
    category: 'Đồ ăn nhanh',
    tags: ['fried chicken', 'fast food', 'burger'],
    businessLicense: 'BL002',
    taxCode: 'TC002',
  },
  {
    ownerUserId: new mongoose.Types.ObjectId(),
    name: 'McDonald\'s',
    description: 'Burger và đồ ăn nhanh với chất lượng quốc tế',
    address: '789 Đường Đồng Khởi, Quận 1, TP.HCM',
    imageUrl: 'https://images.unsplash.com/photo-1626205074719-f067063d5541?w=400',
    phone: '028 3456 7890',
    email: 'mcdonalds@example.com',
    city: 'TP. Hồ Chí Minh',
    district: 'Quận 1',
    ward: 'Phường Bến Nghé',
    latitude: 10.7756,
    longitude: 106.7008,
    status: 'active',
    isOpen: true,
    isVerified: true,
    isFeatured: false,
    rating: 4.1,
    reviewCount: 67,
    orderCount: 134,
    deliveryTime: '18-28 phút',
    deliveryFee: 10000,
    minOrderAmount: 55000,
    category: 'Đồ ăn nhanh',
    tags: ['burger', 'fast food', 'american'],
    businessLicense: 'BL003',
    taxCode: 'TC003',
  },
  {
    ownerUserId: new mongoose.Types.ObjectId(),
    name: 'Phở 24',
    description: 'Phở bò truyền thống với nước dùng đậm đà',
    address: '321 Đường Pasteur, Quận 3, TP.HCM',
    imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400',
    phone: '028 4567 8901',
    email: 'pho24@example.com',
    city: 'TP. Hồ Chí Minh',
    district: 'Quận 3',
    ward: 'Phường Võ Thị Sáu',
    latitude: 10.7829,
    longitude: 106.6934,
    status: 'active',
    isOpen: true,
    isVerified: true,
    isFeatured: true,
    rating: 4.7,
    reviewCount: 156,
    orderCount: 289,
    deliveryTime: '15-25 phút',
    deliveryFee: 8000,
    minOrderAmount: 45000,
    category: 'Món Việt',
    tags: ['pho', 'vietnamese', 'traditional'],
    businessLicense: 'BL004',
    taxCode: 'TC004',
  },
  {
    ownerUserId: new mongoose.Types.ObjectId(),
    name: 'Sushi Hokkaido',
    description: 'Sushi tươi ngon nhập khẩu từ Nhật Bản',
    address: '654 Đường Lê Văn Sỹ, Quận 3, TP.HCM',
    imageUrl: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400',
    phone: '028 5678 9012',
    email: 'sushi@example.com',
    city: 'TP. Hồ Chí Minh',
    district: 'Quận 3',
    ward: 'Phường 10',
    latitude: 10.7889,
    longitude: 106.6869,
    status: 'active',
    isOpen: true,
    isVerified: false,
    isFeatured: false,
    rating: 4.2,
    reviewCount: 43,
    orderCount: 78,
    deliveryTime: '30-40 phút',
    deliveryFee: 20000,
    minOrderAmount: 120000,
    category: 'Món Á',
    tags: ['sushi', 'japanese', 'fresh'],
    businessLicense: 'BL005',
    taxCode: 'TC005',
  },
  {
    ownerUserId: new mongoose.Types.ObjectId(),
    name: 'The Coffee House',
    description: 'Cà phê chất lượng cao với không gian thoải mái',
    address: '987 Đường Nguyễn Thị Minh Khai, Quận 3, TP.HCM',
    imageUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400',
    phone: '028 6789 0123',
    email: 'coffee@example.com',
    city: 'TP. Hồ Chí Minh',
    district: 'Quận 3',
    ward: 'Phường 5',
    latitude: 10.7889,
    longitude: 106.6869,
    status: 'active',
    isOpen: true,
    isVerified: true,
    isFeatured: false,
    rating: 4.0,
    reviewCount: 92,
    orderCount: 167,
    deliveryTime: '10-20 phút',
    deliveryFee: 5000,
    minOrderAmount: 35000,
    category: 'Đồ uống',
    tags: ['coffee', 'beverage', 'cafe'],
    businessLicense: 'BL006',
    taxCode: 'TC006',
  },
];

async function seedRestaurants() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eatnow');
    console.log('Connected to MongoDB');

    // Check if restaurants already exist
    const existingCount = await Restaurant.countDocuments();
    if (existingCount > 0) {
      console.log(`Restaurants already exist (${existingCount} found). Skipping seed.`);
      return;
    }

    // Insert seed data
    const result = await Restaurant.insertMany(seedRestaurants);
    console.log(`✅ Successfully seeded ${result.length} restaurants`);
    
    // Print inserted restaurants
    result.forEach(restaurant => {
      console.log(`  - ${restaurant.name} (${restaurant.category}) - Rating: ${restaurant.rating}`);
    });

  } catch (error) {
    console.error('❌ Error seeding restaurants:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seed function
seedRestaurants();
