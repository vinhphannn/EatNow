const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/eatnow';

async function createRestaurantForUser() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const usersCollection = db.collection('users');
    const restaurantsCollection = db.collection('restaurants');
    
    // Tìm user có role restaurant
    const restaurantUsers = await usersCollection.find({ role: 'restaurant' }).toArray();
    console.log(`Found ${restaurantUsers.length} restaurant users`);
    
    for (const user of restaurantUsers) {
      console.log(`\nProcessing user: ${user.email} (${user._id})`);
      
      // Kiểm tra xem user đã có restaurant chưa
      const existingRestaurant = await restaurantsCollection.findOne({ 
        ownerUserId: user._id 
      });
      
      if (existingRestaurant) {
        console.log(`  ✅ User already has restaurant: ${existingRestaurant.name}`);
        continue;
      }
      
      // Tạo restaurant mới cho user
      const restaurant = {
        ownerUserId: user._id,
        name: `${user.name || user.email.split('@')[0]}'s Restaurant`,
        description: 'Restaurant được tạo tự động',
        address: 'Địa chỉ sẽ được cập nhật',
        status: 'active',
        isOpen: true,
        isAcceptingOrders: true,
        isDeliveryAvailable: true,
        isPickupAvailable: true,
        openTime: '08:00',
        closeTime: '22:00',
        openDays: [0, 1, 2, 3, 4, 5, 6], // Tất cả các ngày
        deliveryFee: 15000,
        minOrderAmount: 50000,
        freeDeliveryThreshold: 200000,
        maxDeliveryDistance: 10,
        deliveryTime: '30-45 phút',
        rating: 0,
        reviewCount: 0,
        orderCount: 0,
        totalRevenue: 0,
        tags: ['restaurant'],
        autoAcceptOrders: false,
        preparationTime: 15,
        allowSpecialRequests: true,
        allowCustomization: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const result = await restaurantsCollection.insertOne(restaurant);
      console.log(`  ✅ Created restaurant: ${restaurant.name} (${result.insertedId})`);
    }
    
    // Tạo một restaurant demo nếu chưa có restaurant nào
    const totalRestaurants = await restaurantsCollection.countDocuments();
    if (totalRestaurants === 0) {
      console.log('\n📝 No restaurants found, creating demo restaurant...');
      
      // Tạo user demo nếu chưa có
      let demoUser = await usersCollection.findOne({ email: 'demo@restaurant.com' });
      if (!demoUser) {
        const userResult = await usersCollection.insertOne({
          email: 'demo@restaurant.com',
          password: '$2b$10$demo', // demo password
          name: 'Demo Restaurant Owner',
          phone: '0123456789',
          role: 'restaurant',
          isActive: true,
          isEmailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        demoUser = { _id: userResult.insertedId, email: 'demo@restaurant.com', name: 'Demo Restaurant Owner' };
        console.log('  ✅ Created demo user');
      }
      
      // Tạo restaurant demo
      const demoRestaurant = {
        ownerUserId: demoUser._id,
        name: 'Nhà Hàng Demo',
        description: 'Nhà hàng demo để test hệ thống',
        address: '123 Đường Demo, Quận 1, TP.HCM',
        status: 'active',
        isOpen: true,
        isAcceptingOrders: true,
        isDeliveryAvailable: true,
        isPickupAvailable: true,
        openTime: '08:00',
        closeTime: '22:00',
        openDays: [0, 1, 2, 3, 4, 5, 6],
        deliveryFee: 15000,
        minOrderAmount: 50000,
        freeDeliveryThreshold: 200000,
        maxDeliveryDistance: 10,
        deliveryTime: '30-45 phút',
        rating: 4.5,
        reviewCount: 25,
        orderCount: 150,
        totalRevenue: 25000000,
        tags: ['demo', 'restaurant'],
        autoAcceptOrders: false,
        preparationTime: 15,
        allowSpecialRequests: true,
        allowCustomization: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const result = await restaurantsCollection.insertOne(demoRestaurant);
      console.log(`  ✅ Created demo restaurant: ${demoRestaurant.name} (${result.insertedId})`);
    }
    
    console.log('\n🎉 Restaurant setup completed!');
    console.log(`Total restaurants: ${await restaurantsCollection.countDocuments()}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

// Chạy script
createRestaurantForUser();


