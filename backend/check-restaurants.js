const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/eatnow';

async function checkRestaurants() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const usersCollection = db.collection('users');
    const restaurantsCollection = db.collection('restaurants');
    
    // Check users with restaurant role
    const restaurantUsers = await usersCollection.find({ role: 'restaurant' }).toArray();
    console.log(`\n📋 Found ${restaurantUsers.length} restaurant users:`);
    
    for (const user of restaurantUsers) {
      console.log(`  - ${user.email} (${user._id})`);
      
      // Check if user has restaurant
      const restaurant = await restaurantsCollection.findOne({ ownerUserId: user._id });
      if (restaurant) {
        console.log(`    ✅ Has restaurant: ${restaurant.name} (${restaurant._id})`);
      } else {
        console.log(`    ❌ No restaurant found`);
      }
    }
    
    // Check all restaurants
    const allRestaurants = await restaurantsCollection.find({}).toArray();
    console.log(`\n🏪 Found ${allRestaurants.length} restaurants:`);
    
    for (const restaurant of allRestaurants) {
      console.log(`  - ${restaurant.name} (${restaurant._id})`);
      console.log(`    Owner: ${restaurant.ownerUserId}`);
      console.log(`    Status: ${restaurant.status}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkRestaurants();


