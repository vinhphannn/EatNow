const { MongoClient } = require('mongodb');
const uri = 'mongodb+srv://infovinhphan_db_user:dE1Arv8M7IhQBdkH@cluster0.qwdcq4j.mongodb.net/eatnow?retryWrites=true&w=majority&appName=Cluster0';

async function checkCustomers() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('eatnow');
    
    // Check customers
    const customers = await db.collection('customers').find({}).limit(5).toArray();
    console.log('Customers:');
    customers.forEach(customer => {
      console.log(`- ${customer._id} (userId: ${customer.userId})`);
    });
    
    // Check orders with customerId
    const orders = await db.collection('orders').find({}, { 
      projection: { _id: 1, code: 1, customerId: 1, createdAt: 1 } 
    }).sort({ createdAt: -1 }).limit(3).toArray();
    
    console.log('\nRecent orders:');
    orders.forEach(order => {
      console.log(`- ${order.code} (customerId: ${order.customerId})`);
    });
    
  } finally {
    await client.close();
  }
}

checkCustomers().catch(console.error);
