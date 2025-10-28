const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

async function createTestOrderForDriver() {
  const mongoUri = process.env.MONGODB_URI;
  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    const db = client.db('eatnow');
    
    // Tìm customer và restaurant
    const customer = await db.collection('users').findOne({ role: 'customer' });
    const restaurant = await db.collection('restaurants').findOne({});
    const driver = await db.collection('drivers').findOne({});
    
    if (!customer || !restaurant || !driver) {
      console.log('❌ Missing customer, restaurant, or driver');
      return;
    }
    
    console.log('👤 Customer:', customer._id);
    console.log('🏪 Restaurant:', restaurant._id);
    console.log('🚗 Driver:', driver._id);
    
    // Tạo đơn hàng picking_up
    const testOrder = {
      customerId: customer._id,
      restaurantId: restaurant._id,
      driverId: driver._id,
      items: [
        {
          itemId: new ObjectId(),
          name: 'Test Item',
          price: 20000,
          quantity: 1,
          subtotal: 20000
        }
      ],
      subtotal: 20000,
      deliveryFee: 10000,
      tip: 0,
      finalTotal: 30000,
      paymentMethod: 'cash',
      status: 'picking_up',
      deliveryAddress: {
        addressLine: '123 Test Street',
        recipientName: 'Test User',
        recipientPhone: '0123456789'
      },
      code: `TEST${Date.now()}`,
      createdAt: new Date(),
      trackingHistory: [{
        status: 'picking_up',
        timestamp: new Date(),
        note: 'Tài xế đang đến lấy hàng',
        updatedBy: 'driver'
      }]
    };
    
    const result = await db.collection('orders').insertOne(testOrder);
    console.log('✅ Test order created:', result.insertedId);
    
    // Cập nhật driver status
    await db.collection('drivers').updateOne(
      { _id: driver._id },
      { 
        $set: { 
          status: 'checkin',
          deliveryStatus: 'delivering',
          currentOrderId: result.insertedId
        }
      }
    );
    
    console.log('✅ Driver status updated');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

createTestOrderForDriver();
