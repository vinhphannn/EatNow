const mongoose = require('mongoose');
require('dotenv').config();

// Global Category Schema
const globalCategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  description: { type: String, trim: true },
  icon: { type: String },
  imageUrl: { type: String },
  position: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  isVisible: { type: Boolean, default: true },
  tags: { type: [String], default: [] },
  restaurantCount: { type: Number, default: 0 },
  orderCount: { type: Number, default: 0 },
  popularityScore: { type: Number, default: 0 },
  slug: { type: String, trim: true },
  metaTitle: { type: String, trim: true },
  metaDescription: { type: String, trim: true },
  keywords: { type: [String], default: [] },
  viewCount: { type: Number, default: 0 },
  clickCount: { type: Number, default: 0 },
  conversionRate: { type: Number, default: 0 },
  parentCategoryId: { type: String },
  level: { type: Number, default: 0 },
  isFeatured: { type: Boolean, default: false }
}, { timestamps: true });

const GlobalCategory = mongoose.model('GlobalCategory', globalCategorySchema);

const sampleCategories = [
  {
    name: 'Pizza',
    description: 'Pizza Ý truyền thống và hiện đại',
    icon: '🍕',
    position: 1,
    isFeatured: true,
    restaurantCount: 12,
    orderCount: 45,
    popularityScore: 95,
    slug: 'pizza',
    tags: ['pizza', 'italian', 'cheese'],
    keywords: ['pizza', 'pizza ý', 'pizza phô mai']
  },
  {
    name: 'Đồ ăn nhanh',
    description: 'Burger, gà rán và các món ăn nhanh',
    icon: '🍔',
    position: 2,
    isFeatured: true,
    restaurantCount: 8,
    orderCount: 32,
    popularityScore: 88,
    slug: 'fast-food',
    tags: ['fast-food', 'burger', 'fried-chicken'],
    keywords: ['đồ ăn nhanh', 'burger', 'gà rán']
  },
  {
    name: 'Món Việt',
    description: 'Ẩm thực truyền thống Việt Nam',
    icon: '🍜',
    position: 3,
    isFeatured: true,
    restaurantCount: 15,
    orderCount: 67,
    popularityScore: 92,
    slug: 'vietnamese',
    tags: ['vietnamese', 'traditional', 'pho'],
    keywords: ['món việt', 'phở', 'bún', 'cơm']
  },
  {
    name: 'Món Á',
    description: 'Ẩm thực châu Á đa dạng',
    icon: '🥢',
    position: 4,
    isFeatured: false,
    restaurantCount: 10,
    orderCount: 54,
    popularityScore: 78,
    slug: 'asian',
    tags: ['asian', 'chinese', 'japanese', 'korean'],
    keywords: ['món á', 'món trung', 'sushi', 'kimchi']
  },
  {
    name: 'Món Tây',
    description: 'Ẩm thực phương Tây cao cấp',
    icon: '🍽️',
    position: 5,
    isFeatured: false,
    restaurantCount: 6,
    orderCount: 28,
    popularityScore: 65,
    slug: 'western',
    tags: ['western', 'steak', 'fine-dining'],
    keywords: ['món tây', 'steak', 'fine dining']
  },
  {
    name: 'Tráng miệng',
    description: 'Bánh ngọt, kem và đồ tráng miệng',
    icon: '🍰',
    position: 6,
    isFeatured: false,
    restaurantCount: 4,
    orderCount: 18,
    popularityScore: 55,
    slug: 'desserts',
    tags: ['desserts', 'cake', 'ice-cream', 'sweet'],
    keywords: ['tráng miệng', 'bánh ngọt', 'kem', 'đồ ngọt']
  },
  {
    name: 'Cà phê & Trà',
    description: 'Cà phê, trà và đồ uống nóng',
    icon: '☕',
    position: 7,
    isFeatured: false,
    restaurantCount: 8,
    orderCount: 35,
    popularityScore: 70,
    slug: 'coffee-tea',
    tags: ['coffee', 'tea', 'beverages', 'hot-drinks'],
    keywords: ['cà phê', 'trà', 'đồ uống nóng']
  },
  {
    name: 'Trà sữa',
    description: 'Trà sữa và các loại trà sữa đặc biệt',
    icon: '🧋',
    position: 8,
    isFeatured: false,
    restaurantCount: 12,
    orderCount: 42,
    popularityScore: 75,
    slug: 'bubble-tea',
    tags: ['bubble-tea', 'milk-tea', 'pearls'],
    keywords: ['trà sữa', 'bubble tea', 'trà sữa trân châu']
  }
];

async function seedGlobalCategories() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eatnow');
    console.log('Connected to MongoDB');

    // Clear existing categories
    await GlobalCategory.deleteMany({});
    console.log('Cleared existing global categories');

    // Insert sample categories
    const createdCategories = await GlobalCategory.insertMany(sampleCategories);
    console.log(`Created ${createdCategories.length} global categories:`);
    
    createdCategories.forEach(category => {
      console.log(`- ${category.name} (${category.slug})`);
    });

    console.log('Global categories seeded successfully!');
  } catch (error) {
    console.error('Error seeding global categories:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seeder
seedGlobalCategories();
