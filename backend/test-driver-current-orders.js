const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

async function testDriverCurrentOrders() {
  const mongoUri = process.env.MONGODB_URI;
  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    const db = client.db('eatnow');
    
    // Tìm driver
    const drivers = await db.collection('drivers').find({}).limit(5).toArray();
    console.log('Available drivers:');
    drivers.forEach(driver => {
      console.log('Driver:', { 
        id: driver._id, 
        userId: driver.userId, 
        userIdType: typeof driver.userId 
      });
    });
    
    if (drivers.length > 0) {
      const driver = drivers[0];
      console.log('\nTesting with driver:', driver._id);
      console.log('Driver userId:', driver.userId);
      console.log('Driver userId type:', typeof driver.userId);
      
      // Tìm orders với driverId này
      const orders = await db.collection('orders').find({
        driverId: driver._id,
        status: { $nin: ['delivered', 'cancelled'] }
      }).toArray();
      
      console.log('\nCurrent orders for this driver:', orders.length);
      orders.forEach(order => {
        console.log('Order:', { 
          id: order._id, 
          code: order.code, 
          status: order.status,
          driverId: order.driverId 
        });
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

testDriverCurrentOrders();
