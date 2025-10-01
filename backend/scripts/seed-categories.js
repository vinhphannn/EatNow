const mongoose = require('mongoose');
require('dotenv').config();

// Define GlobalCategory schema
const globalCategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  description: String,
  imageUrl: String,
  icon: String,
  position: { type: Number, default: 0 },
  isFeatured: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  isVisible: { type: Boolean, default: true },
  restaurantCount: { type: Number, default: 0 },
  itemCount: { type: Number, default: 0 },
  popularityScore: { type: Number, default: 0 },
  metadata: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

const GlobalCategory = mongoose.model('GlobalCategory', globalCategorySchema);

// Seed data for global categories
const seedCategories = [
  {
    name: 'Pizza',
    slug: 'pizza',
    description: 'Pizza Ý truyền thống và hiện đại',
    icon: '🍕',
    position: 1,
    isFeatured: true,
    restaurantCount: 12,
    itemCount: 45,
    popularityScore: 95,
  },
  {
    name: 'Đồ ăn nhanh',
    slug: 'fast-food',
    description: 'Burger, gà rán và các món ăn nhanh',
    icon: '🍔',
    position: 2,
    isFeatured: true,
    restaurantCount: 8,
    itemCount: 32,
    popularityScore: 88,
  },
  {
    name: 'Món Việt',
    slug: 'vietnamese',
    description: 'Ẩm thực truyền thống Việt Nam',
    icon: '🍜',
    position: 3,
    isFeatured: true,
    restaurantCount: 15,
    itemCount: 67,
    popularityScore: 92,
  },
  {
    name: 'Món Á',
    slug: 'asian',
    description: 'Ẩm thực châu Á đa dạng',
    icon: '🥢',
    position: 4,
    isFeatured: false,
    restaurantCount: 10,
    itemCount: 54,
    popularityScore: 78,
  },
  {
    name: 'Món Tây',
    slug: 'western',
    description: 'Ẩm thực phương Tây cao cấp',
    icon: '🍽️',
    position: 5,
    isFeatured: false,
    restaurantCount: 6,
    itemCount: 28,
    popularityScore: 65,
  },
  {
    name: 'Tráng miệng',
    slug: 'desserts',
    description: 'Bánh ngọt, kem và đồ tráng miệng',
    icon: '🍰',
    position: 6,
    isFeatured: false,
    restaurantCount: 4,
    itemCount: 18,
    popularityScore: 55,
  },
  {
    name: 'Đồ uống',
    slug: 'beverages',
    description: 'Nước giải khát, cà phê, trà',
    icon: '🥤',
    position: 7,
    isFeatured: false,
    restaurantCount: 5,
    itemCount: 25,
    popularityScore: 48,
  },
  {
    name: 'Món chay',
    slug: 'vegetarian',
    description: 'Ẩm thực chay tốt cho sức khỏe',
    icon: '🥗',
    position: 8,
    isFeatured: false,
    restaurantCount: 3,
    itemCount: 15,
    popularityScore: 35,
  },
];

async function seedCategories() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eatnow');
    console.log('Connected to MongoDB');

    // Check if categories already exist
    const existingCount = await GlobalCategory.countDocuments();
    if (existingCount > 0) {
      console.log(`Categories already exist (${existingCount} found). Skipping seed.`);
      return;
    }

    // Insert seed data
    const result = await GlobalCategory.insertMany(seedCategories);
    console.log(`✅ Successfully seeded ${result.length} global categories`);
    
    // Print inserted categories
    result.forEach(cat => {
      console.log(`  - ${cat.icon} ${cat.name} (${cat.slug})`);
    });

  } catch (error) {
    console.error('❌ Error seeding categories:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seed function
seedCategories();