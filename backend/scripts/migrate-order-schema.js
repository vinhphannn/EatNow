const { MongoClient } = require('mongodb');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/eatnow';
const DB_NAME = process.env.DB_NAME || 'eatnow';

async function migrateOrderSchema() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('🔗 Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    const ordersCollection = db.collection('orders');
    
    // Get all orders
    const orders = await ordersCollection.find({}).toArray();
    console.log(`📦 Found ${orders.length} orders to migrate`);
    
    let migratedCount = 0;
    
    for (const order of orders) {
      const updateData = {};
      
      // Migrate items structure
      if (order.items && Array.isArray(order.items)) {
        updateData.items = order.items.map(item => ({
          itemId: item.itemId || item.foodId,
          name: item.name || item.foodName || 'Món không xác định',
          price: item.price || 0,
          imageUrl: item.imageUrl || item.image,
          description: item.description,
          quantity: item.quantity || item.qty || 1,
          options: item.options || [],
          subtotal: item.subtotal || (item.price || 0) * (item.quantity || 1),
          totalPrice: item.totalPrice || item.total || item.subtotal || 0,
          specialInstructions: item.specialInstructions || item.note || ''
        }));
      }
      
      // Add pricing breakdown if missing
      if (!order.subtotal && order.total) {
        updateData.subtotal = order.total - (order.deliveryFee || 0);
      }
      
      if (!order.tip) updateData.tip = 0;
      if (!order.doorFee) updateData.doorFee = 0;
      if (!order.discount) updateData.discount = 0;
      
      // Add delivery mode
      if (!order.deliveryMode) {
        updateData.deliveryMode = 'immediate';
      }
      
      // Add order source
      if (!order.orderSource) {
        updateData.orderSource = 'web';
      }
      
      // Add tracking history if missing
      if (!order.trackingHistory || order.trackingHistory.length === 0) {
        updateData.trackingHistory = [{
          status: order.status || 'pending',
          timestamp: order.createdAt || new Date(),
          note: 'Đơn hàng được tạo',
          updatedBy: 'system'
        }];
      }
      
      // Update order
      if (Object.keys(updateData).length > 0) {
        await ordersCollection.updateOne(
          { _id: order._id },
          { $set: updateData }
        );
        migratedCount++;
        console.log(`✅ Migrated order ${order._id}`);
      }
    }
    
    console.log(`🎉 Migration completed! ${migratedCount} orders updated`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run migration
if (require.main === module) {
  migrateOrderSchema()
    .then(() => {
      console.log('✅ Migration script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateOrderSchema };
