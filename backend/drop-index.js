// Quick script to drop problematic unique index
const mongoose = require('mongoose');

async function dropIndex() {
  try {
    await mongoose.connect('mongodb://localhost:27017/eatnow');
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const collection = db.collection('cartitems');
    
    // List current indexes
    const indexes = await collection.indexes();
    console.log('Current indexes:');
    indexes.forEach(index => {
      console.log(`- ${index.name}: ${JSON.stringify(index.key)} ${index.unique ? '(unique)' : ''}`);
    });
    
    // Try to drop the unique index
    try {
      await collection.dropIndex('cartId_1_itemId_1');
      console.log('✅ Dropped unique index cartId_1_itemId_1');
    } catch (error) {
      if (error.code === 27) {
        console.log('ℹ️ Index cartId_1_itemId_1 does not exist');
      } else {
        console.log('❌ Error dropping index:', error.message);
      }
    }
    
    // Create non-unique index
    await collection.createIndex({ cartId: 1, itemId: 1 });
    console.log('✅ Created non-unique index cartId_1_itemId_1');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

dropIndex();









