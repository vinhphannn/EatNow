const { MongoClient } = require('mongodb');
const uri = 'mongodb+srv://infovinhphan_db_user:dE1Arv8M7IhQBdkH@cluster0.qwdcq4j.mongodb.net/eatnow?retryWrites=true&w=majority&appName=Cluster0';

async function checkOrders() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('eatnow');
    const orders = await db.collection('orders').find({}, { 
      projection: { code: 1, orderCode: 1, createdAt: 1 } 
    }).sort({ createdAt: -1 }).limit(5).toArray();
    
    console.log('Recent orders:');
    orders.forEach(order => {
      console.log(`- ${order.code || order.orderCode || 'No code'} (created: ${order.createdAt})`);
    });
  } finally {
    await client.close();
  }
}

checkOrders().catch(console.error);
