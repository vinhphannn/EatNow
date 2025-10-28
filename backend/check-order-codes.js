const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

async function checkOrderCodes() {
  const mongoUri = process.env.MONGODB_URI;
  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    const db = client.db('eatnow');
    
    // Tìm tất cả orders với code bắt đầu bằng ORD
    const orders = await db.collection('orders').find({ 
      code: { $regex: /^ORD/ } 
    }).sort({ createdAt: -1 }).limit(20).toArray();
    
    console.log('Recent orders with ORD code:');
    orders.forEach(order => {
      console.log('Order:', { 
        id: order._id, 
        code: order.code, 
        createdAt: order.createdAt 
      });
    });
    
    // Kiểm tra duplicate codes
    const duplicateCodes = await db.collection('orders').aggregate([
      { $match: { code: { $exists: true, $ne: null } } },
      { $group: { _id: '$code', count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } }
    ]).toArray();
    
    if (duplicateCodes.length > 0) {
      console.log('\nDuplicate codes found:');
      duplicateCodes.forEach(dup => {
        console.log(`Code ${dup._id}: ${dup.count} orders`);
      });
    } else {
      console.log('\nNo duplicate codes found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

checkOrderCodes();
