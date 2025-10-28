const { MongoClient } = require('mongodb');
require('dotenv').config();

async function checkOrders() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
  console.log('🔗 Using MongoDB URI:', mongoUri);
  
  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    const db = client.db('eatnow');
    
    // Tìm đơn hàng tiền mặt gần đây
    const orders = await db.collection('orders').find({ 
      paymentMethod: 'cash', 
      status: { $nin: ['delivered', 'cancelled'] } 
    }).sort({ createdAt: -1 }).limit(5).toArray();
    
    console.log('🔍 Recent cash orders:', orders.length);
    
    orders.forEach(order => {
      console.log('📦 Order:', {
        id: order._id,
        finalTotal: order.finalTotal,
        paymentMethod: order.paymentMethod,
        status: order.status,
        createdAt: order.createdAt
      });
    });
    
    // Tìm đơn hàng có driverId
    const ordersWithDriver = await db.collection('orders').find({ 
      driverId: { $exists: true, $ne: null }
    }).sort({ createdAt: -1 }).limit(3).toArray();
    
    console.log('\n🔍 Orders with driver:', ordersWithDriver.length);
    
    ordersWithDriver.forEach(order => {
      console.log('🚗 Order with driver:', {
        id: order._id,
        driverId: order.driverId,
        finalTotal: order.finalTotal,
        paymentMethod: order.paymentMethod,
        status: order.status
      });
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

checkOrders();