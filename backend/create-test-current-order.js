const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

async function createTestCurrentOrder() {
  const mongoUri = process.env.MONGODB_URI;
  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    const db = client.db('eatnow');
    
    // Tìm driver
    const driver = await db.collection('drivers').findOne({});
    if (!driver) {
      console.log('❌ No driver found');
      return;
    }
    
    console.log('Driver:', { id: driver._id, userId: driver.userId });
    
    // Tìm customer và restaurant
    const customer = await db.collection('users').findOne({ role: 'customer' });
    const restaurant = await db.collection('restaurants').findOne({});
    
    if (!customer || !restaurant) {
      console.log('❌ Missing customer or restaurant');
      return;
    }
    
    // Tạo order với status picking_up
    const testOrder = {
      customerId: customer._id,
      restaurantId: restaurant._id,
      driverId: driver._id,
      items: [
        {
          itemId: new ObjectId(),
          name: 'Test Item',
          price: 25000,
          quantity: 1,
          subtotal: 25000
        }
      ],
      subtotal: 25000,
      deliveryFee: 15000,
      tip: 0,
      finalTotal: 40000,
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
    console.log('Order code:', testOrder.code);
    console.log('Order status:', testOrder.status);
    console.log('Driver ID:', driver._id);
    
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

createTestCurrentOrder();
