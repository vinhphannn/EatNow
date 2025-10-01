const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/eatnow').then(async () => {
  const db = mongoose.connection.db;
  
  console.log('Connected to MongoDB');
  
  // Check items
  const items = await db.collection('items').find({}).toArray();
  console.log('Total items:', items.length);
  
  if (items.length > 0) {
    console.log('First item:', {
      _id: items[0]._id,
      name: items[0].name,
      isActive: items[0].isActive,
      restaurantId: items[0].restaurantId
    });
    
    // Check active items
    const activeItems = await db.collection('items').find({ isActive: true }).toArray();
    console.log('Active items:', activeItems.length);
    
    if (activeItems.length > 0) {
      console.log('First active item:', {
        _id: activeItems[0]._id,
        name: activeItems[0].name,
        isActive: activeItems[0].isActive
      });
    }
  }
  
  mongoose.disconnect();
}).catch(console.error);

