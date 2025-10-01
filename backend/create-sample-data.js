require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');

// Restaurant Schema
const restaurantSchema = new mongoose.Schema({
  name: String,
  description: String,
  address: String,
  imageUrl: String,
  rating: Number,
  deliveryTime: String,
  category: String,
  isOpen: Boolean,
  status: String,
  ownerUserId: mongoose.Schema.Types.ObjectId,
  createdAt: Date
});

const Restaurant = mongoose.model('Restaurant', restaurantSchema);

async function createSampleData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://eatnow:eatnow123@cluster0.mongodb.net/eatnow?retryWrites=true&w=majority', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected for sample data creation.');

    // Clear existing restaurants
    await Restaurant.deleteMany({});
    console.log('Cleared existing restaurants.');

    // Create sample restaurants
    const sampleRestaurants = [
      {
        name: "Pizza Hut",
        description: "Nhà hàng pizza nổi tiếng thế giới với hương vị đặc trưng",
        address: "123 Đường Lê Lợi, Quận 1, TP.HCM",
        imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400",
        rating: 4.5,
        deliveryTime: "25-35 phút",
        category: "Pizza",
        isOpen: true,
        status: "active",
        ownerUserId: new mongoose.Types.ObjectId(),
        createdAt: new Date()
      },
      {
        name: "KFC",
        description: "Gà rán KFC với công thức độc quyền, giòn tan bên ngoài, mềm ngon bên trong",
        address: "456 Đường Nguyễn Huệ, Quận 1, TP.HCM",
        imageUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400",
        rating: 4.3,
        deliveryTime: "20-30 phút",
        category: "Đồ ăn nhanh",
        isOpen: true,
        status: "active",
        ownerUserId: new mongoose.Types.ObjectId(),
        createdAt: new Date()
      },
      {
        name: "McDonald's",
        description: "Burger và đồ ăn nhanh với chất lượng quốc tế",
        address: "789 Đường Đồng Khởi, Quận 1, TP.HCM",
        imageUrl: "https://images.unsplash.com/photo-1626205074719-f067063d5541?w=400",
        rating: 4.1,
        deliveryTime: "18-28 phút",
        category: "Đồ ăn nhanh",
        isOpen: true,
        status: "active",
        ownerUserId: new mongoose.Types.ObjectId(),
        createdAt: new Date()
      },
      {
        name: "Phở 24",
        description: "Phở bò truyền thống với nước dùng đậm đà, thịt bò tươi ngon",
        address: "321 Đường Pasteur, Quận 3, TP.HCM",
        imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400",
        rating: 4.7,
        deliveryTime: "15-25 phút",
        category: "Món Việt",
        isOpen: true,
        status: "active",
        ownerUserId: new mongoose.Types.ObjectId(),
        createdAt: new Date()
      },
      {
        name: "Bún Bò Huế",
        description: "Bún bò Huế chính hiệu với hương vị đặc trưng của xứ Huế",
        address: "654 Đường Lý Tự Trọng, Quận 1, TP.HCM",
        imageUrl: "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=400",
        rating: 4.6,
        deliveryTime: "20-30 phút",
        category: "Món Việt",
        isOpen: true,
        status: "active",
        ownerUserId: new mongoose.Types.ObjectId(),
        createdAt: new Date()
      },
      {
        name: "Sushi Hokkaido",
        description: "Sushi Nhật Bản tươi ngon, được làm từ nguyên liệu nhập khẩu",
        address: "987 Đường Hai Bà Trưng, Quận 1, TP.HCM",
        imageUrl: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400",
        rating: 4.8,
        deliveryTime: "30-45 phút",
        category: "Món Á",
        isOpen: true,
        status: "active",
        ownerUserId: new mongoose.Types.ObjectId(),
        createdAt: new Date()
      }
    ];

    const createdRestaurants = await Restaurant.insertMany(sampleRestaurants);
    console.log(`Created ${createdRestaurants.length} sample restaurants:`);
    createdRestaurants.forEach(restaurant => {
      console.log(`- ${restaurant.name} (${restaurant.category})`);
    });

  } catch (error) {
    console.error('Error creating sample data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected.');
  }
}

createSampleData();
