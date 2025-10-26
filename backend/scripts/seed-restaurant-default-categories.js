const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eatnow', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Category Schema
const categorySchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: false },
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, default: '' },
  icon: { type: String, default: '🍽️' },
  color: { type: String, default: 'from-gray-400 to-gray-500' },
  position: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  imageUrl: { type: String, default: '' },
}, { timestamps: true });

const Category = mongoose.model('Category', categorySchema);

// Default categories for new restaurants
const defaultCategories = [
  {
    name: 'Món chính',
    slug: 'mon-chinh',
    description: 'Các món ăn chính của nhà hàng',
    icon: '🍽️',
    color: 'from-orange-400 to-red-500',
    position: 1,
    isActive: true
  },
  {
    name: 'Món thêm',
    slug: 'mon-them',
    description: 'Các món ăn kèm, món phụ',
    icon: '🥗',
    color: 'from-green-400 to-emerald-500',
    position: 2,
    isActive: true
  },
  {
    name: 'Giải khát',
    slug: 'giai-khat',
    description: 'Nước uống, đồ giải khát',
    icon: '🥤',
    color: 'from-blue-400 to-cyan-500',
    position: 3,
    isActive: true
  },
  {
    name: 'Đồ ăn vặt',
    slug: 'do-an-vat',
    description: 'Snack, đồ ăn vặt',
    icon: '🍿',
    color: 'from-yellow-400 to-orange-500',
    position: 4,
    isActive: true
  },
  {
    name: 'Tráng miệng',
    slug: 'trang-mieng',
    description: 'Bánh ngọt, kem, chè',
    icon: '🍰',
    color: 'from-pink-400 to-purple-500',
    position: 5,
    isActive: true
  }
];

async function seedDefaultCategoriesForRestaurant(restaurantId) {
  try {
    console.log(`🌱 Seeding default categories for restaurant: ${restaurantId}`);
    
    // Check if restaurant already has categories
    const existingCategories = await Category.find({ restaurantId: new mongoose.Types.ObjectId(restaurantId) });
    if (existingCategories.length > 0) {
      console.log(`⚠️  Restaurant ${restaurantId} already has ${existingCategories.length} categories. Skipping...`);
      return;
    }

    // Create default categories for this restaurant
    const categoriesToCreate = defaultCategories.map(cat => ({
      ...cat,
      restaurantId: new mongoose.Types.ObjectId(restaurantId),
      slug: `${cat.slug}-${restaurantId}` // Make slug unique per restaurant
    }));

    const createdCategories = await Category.insertMany(categoriesToCreate);
    console.log(`✅ Created ${createdCategories.length} default categories for restaurant ${restaurantId}:`);
    createdCategories.forEach(cat => {
      console.log(`   - ${cat.name} (${cat.slug})`);
    });

    return createdCategories;
  } catch (error) {
    console.error(`❌ Error seeding categories for restaurant ${restaurantId}:`, error.message);
    throw error;
  }
}

async function seedAllRestaurants() {
  try {
    // Get all restaurants
    const Restaurant = mongoose.model('Restaurant', new mongoose.Schema({}, { strict: false }));
    const restaurants = await Restaurant.find({});
    
    console.log(`🏪 Found ${restaurants.length} restaurants`);
    
    for (const restaurant of restaurants) {
      await seedDefaultCategoriesForRestaurant(restaurant._id);
    }
    
    console.log('🎉 Completed seeding default categories for all restaurants!');
  } catch (error) {
    console.error('❌ Error seeding all restaurants:', error.message);
  } finally {
    mongoose.connection.close();
  }
}

// Run the script
if (require.main === module) {
  const restaurantId = process.argv[2];
  
  if (restaurantId) {
    // Seed for specific restaurant
    seedDefaultCategoriesForRestaurant(restaurantId)
      .then(() => {
        console.log('✅ Done!');
        mongoose.connection.close();
      })
      .catch(error => {
        console.error('❌ Error:', error.message);
        mongoose.connection.close();
      });
  } else {
    // Seed for all restaurants
    seedAllRestaurants();
  }
}

module.exports = { seedDefaultCategoriesForRestaurant };
