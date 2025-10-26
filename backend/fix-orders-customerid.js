const { MongoClient } = require('mongodb');
const uri = 'mongodb+srv://infovinhphan_db_user:dE1Arv8M7IhQBdkH@cluster0.qwdcq4j.mongodb.net/eatnow?retryWrites=true&w=majority&appName=Cluster0';

async function fixOrdersCustomerId() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('eatnow');
    
    console.log('🔧 Fixing orders customerId mapping...');
    
    // Get all orders
    const orders = await db.collection('orders').find({}).toArray();
    console.log(`Found ${orders.length} orders`);
    
    // Get all customers with userId
    const customers = await db.collection('customers').find({ userId: { $exists: true } }).toArray();
    const customerMap = new Map();
    customers.forEach(customer => {
      customerMap.set(customer._id.toString(), customer.userId);
    });
    
    console.log('📋 Customer mapping:');
    customerMap.forEach((userId, customerId) => {
      console.log(`  ${customerId} -> ${userId}`);
    });
    
    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const order of orders) {
      const currentCustomerId = order.customerId;
      const orderCode = order.code || order._id.toString().slice(-8);
      
      console.log(`\n📦 Processing order ${orderCode}:`);
      console.log(`  Current customerId: ${currentCustomerId} (type: ${typeof currentCustomerId})`);
      
      // Check if already using userId (string)
      if (typeof currentCustomerId === 'string') {
        console.log(`  ✅ Already using userId format`);
        skippedCount++;
        continue;
      }
      
      // Check if using customer._id (ObjectId string)
      if (typeof currentCustomerId === 'string' && customerMap.has(currentCustomerId)) {
        const userId = customerMap.get(currentCustomerId);
        console.log(`  🔄 Migrating from customer._id (${currentCustomerId}) to userId (${userId})`);
        
        try {
          await db.collection('orders').updateOne(
            { _id: order._id },
            { $set: { customerId: userId } }
          );
          console.log(`  ✅ Updated successfully`);
          migratedCount++;
        } catch (error) {
          console.log(`  ❌ Update failed: ${error.message}`);
          errorCount++;
        }
      } else {
        console.log(`  ⚠️ No mapping found for customerId: ${currentCustomerId}`);
        errorCount++;
      }
    }
    
    console.log(`\n📊 Migration results:`);
    console.log(`- Migrated: ${migratedCount} orders`);
    console.log(`- Skipped: ${skippedCount} orders`);
    console.log(`- Errors: ${errorCount} orders`);
    console.log(`- Total: ${orders.length} orders`);
    
    // Verify results
    console.log(`\n🔍 Verifying results...`);
    const updatedOrders = await db.collection('orders').find({}).toArray();
    updatedOrders.forEach(order => {
      console.log(`- ${order.code || order._id.toString().slice(-8)}: customerId = ${order.customerId}`);
    });
    
  } finally {
    await client.close();
  }
}

fixOrdersCustomerId().catch(console.error);
