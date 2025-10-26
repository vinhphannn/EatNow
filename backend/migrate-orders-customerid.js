const { MongoClient } = require('mongodb');
const uri = 'mongodb+srv://infovinhphan_db_user:dE1Arv8M7IhQBdkH@cluster0.qwdcq4j.mongodb.net/eatnow?retryWrites=true&w=majority&appName=Cluster0';

async function migrateOrdersCustomerId() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('eatnow');
    
    console.log('🔍 Checking current orders...');
    
    // Get all orders
    const orders = await db.collection('orders').find({}).toArray();
    console.log(`Found ${orders.length} orders`);
    
    // Get all customers
    const customers = await db.collection('customers').find({}).toArray();
    const customerMap = new Map();
    customers.forEach(customer => {
      customerMap.set(customer._id.toString(), customer.userId);
    });
    
    console.log('📋 Migration plan:');
    let migratedCount = 0;
    let skippedCount = 0;
    
    for (const order of orders) {
      const currentCustomerId = order.customerId;
      
      // Check if already using userId (string)
      if (typeof currentCustomerId === 'string') {
        console.log(`✅ Order ${order.code || order._id}: Already using userId (${currentCustomerId})`);
        skippedCount++;
        continue;
      }
      
      // Check if using customer._id (ObjectId)
      if (typeof currentCustomerId === 'object' && currentCustomerId.$oid) {
        const customerIdStr = currentCustomerId.$oid;
        const userId = customerMap.get(customerIdStr);
        
        if (userId) {
          console.log(`🔄 Order ${order.code || order._id}: Will migrate from customer._id (${customerIdStr}) to userId (${userId})`);
          
          // Update order
          await db.collection('orders').updateOne(
            { _id: order._id },
            { $set: { customerId: userId } }
          );
          
          migratedCount++;
        } else {
          console.log(`❌ Order ${order.code || order._id}: No matching customer found for ${customerIdStr}`);
        }
      }
    }
    
    console.log(`\n📊 Migration results:`);
    console.log(`- Migrated: ${migratedCount} orders`);
    console.log(`- Skipped: ${skippedCount} orders`);
    console.log(`- Total: ${orders.length} orders`);
    
  } finally {
    await client.close();
  }
}

migrateOrdersCustomerId().catch(console.error);
