const { MongoClient } = require('mongodb');
const uri = 'mongodb+srv://infovinhphan_db_user:dE1Arv8M7IhQBdkH@cluster0.qwdcq4j.mongodb.net/eatnow?retryWrites=true&w=majority&appName=Cluster0';

async function debugOrders() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('eatnow');
    
    console.log('🔍 Debugging orders...');
    
    // Get all orders with detailed info
    const orders = await db.collection('orders').find({}).toArray();
    console.log(`Found ${orders.length} orders`);
    
    orders.forEach((order, index) => {
      console.log(`\n📦 Order ${index + 1}:`);
      console.log(`  - _id: ${order._id}`);
      console.log(`  - code: ${order.code}`);
      console.log(`  - customerId: ${order.customerId} (type: ${typeof order.customerId})`);
      console.log(`  - createdAt: ${order.createdAt}`);
    });
    
    // Get customers
    const customers = await db.collection('customers').find({}).toArray();
    console.log(`\n👥 Found ${customers.length} customers:`);
    
    customers.forEach((customer, index) => {
      console.log(`\n👤 Customer ${index + 1}:`);
      console.log(`  - _id: ${customer._id}`);
      console.log(`  - userId: ${customer.userId}`);
    });
    
  } finally {
    await client.close();
  }
}

debugOrders().catch(console.error);
