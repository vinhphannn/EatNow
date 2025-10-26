const mongoose = require('mongoose');

async function debugCart() {
  try {
    await mongoose.connect('mongodb://localhost:27017/eatnow');
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    
    // Check if carts collection exists
    const collections = await db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
    
    // Check carts collection
    try {
      const cartCount = await db.collection('carts').countDocuments();
      console.log('Carts count:', cartCount);
      
      const carts = await db.collection('carts').find().limit(5).toArray();
      console.log('Sample carts:', JSON.stringify(carts, null, 2));
    } catch (e) {
      console.log('Carts collection error:', e.message);
    }
    
    // Check items collection
    try {
      const itemCount = await db.collection('items').countDocuments();
      console.log('Items count:', itemCount);
      
      const sampleItem = await db.collection('items').findOne();
      console.log('Sample item:', JSON.stringify(sampleItem, null, 2));
    } catch (e) {
      console.log('Items collection error:', e.message);
    }
    
    mongoose.disconnect();
  } catch (error) {
    console.error('Debug error:', error);
  }
}

debugCart();
