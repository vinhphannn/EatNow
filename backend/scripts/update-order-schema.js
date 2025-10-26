const { MongoClient } = require('mongodb');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/eatnow';
const DB_NAME = process.env.DB_NAME || 'eatnow';

async function updateOrderSchema() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('🔗 Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    const ordersCollection = db.collection('orders');
    
    // Get all orders
    const orders = await ordersCollection.find({}).toArray();
    console.log(`📦 Found ${orders.length} orders to update`);
    
    let updatedCount = 0;
    
    for (const order of orders) {
      const updateData = {};
      
      // Update items to include options and totalPrice
      if (order.items && Array.isArray(order.items)) {
        updateData.items = order.items.map(item => ({
          ...item,
          totalPrice: item.totalPrice || item.subtotal || (item.price * item.quantity),
          options: item.options || [],
          specialInstructions: item.specialInstructions || ''
        }));
      }
      
      // Update order if there are changes
      if (Object.keys(updateData).length > 0) {
        await ordersCollection.updateOne(
          { _id: order._id },
          { $set: updateData }
        );
        updatedCount++;
        console.log(`✅ Updated order ${order._id}`);
      }
    }
    
    console.log(`🎉 Schema update completed! ${updatedCount} orders updated`);
    
  } catch (error) {
    console.error('❌ Schema update failed:', error);
    throw error;
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run update
if (require.main === module) {
  updateOrderSchema()
    .then(() => {
      console.log('✅ Schema update script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Schema update script failed:', error);
      process.exit(1);
    });
}

module.exports = { updateOrderSchema };
