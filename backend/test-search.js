const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eatnow');

// Define schemas
const restaurantSchema = new mongoose.Schema({
  name: String,
  description: String,
  address: String,
  tags: [String],
  status: { type: String, default: 'active' },
  rating: { type: Number, default: 0 }
}, { timestamps: true });

const itemSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const Restaurant = mongoose.model('Restaurant', restaurantSchema);
const Item = mongoose.model('Item', itemSchema);

async function testSearch() {
  try {
    console.log('🔍 Testing search functionality...');
    
    // Test restaurant search
    const restaurants = await Restaurant.find({
      $and: [
        { status: 'active' },
        {
          $or: [
            { name: /phở/i },
            { description: /phở/i },
            { address: /phở/i },
            { tags: { $in: [/phở/i] } }
          ]
        }
      ]
    }).limit(5);
    
    console.log('✅ Restaurant search results:', restaurants.length);
    
    // Test item search
    const items = await Item.find({
      $and: [
        { isActive: true },
        {
          $or: [
            { name: /phở/i },
            { description: /phở/i }
          ]
        }
      ]
    }).populate('restaurantId', 'name description imageUrl rating deliveryFee address').limit(5);
    
    console.log('✅ Item search results:', items.length);
    
    console.log('🎉 Search functionality works!');
    
  } catch (error) {
    console.error('❌ Search test failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

testSearch();
