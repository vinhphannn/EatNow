const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

async function createTestCashOrder() {
  const mongoUri = process.env.MONGODB_URI;
  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    const db = client.db('eatnow');
    
    // Tìm customer và restaurant
    const customer = await db.collection('users').findOne({ role: 'customer' });
    const restaurant = await db.collection('restaurants').findOne({});
    
    if (!customer || !restaurant) {
      console.log('❌ No customer or restaurant found');
      return;
    }
    
    console.log('👤 Customer:', customer._id);
    console.log('🏪 Restaurant:', restaurant._id);
    
    // Tạo đơn hàng tiền mặt test
    const testOrder = {
      customerId: customer._id,
      restaurantId: restaurant._id,
      items: [
        {
          itemId: new ObjectId(),
          name: 'Test Item',
          price: 50000,
          quantity: 1,
          subtotal: 50000
        }
      ],
      subtotal: 50000,
      deliveryFee: 10000,
      tip: 0,
      finalTotal: 60000,
      paymentMethod: 'cash',
      status: 'confirmed',
      deliveryAddress: {
        addressLine: '123 Test Street',
        recipientName: 'Test User',
        recipientPhone: '0123456789'
      },
      createdAt: new Date(),
      code: `TEST${Date.now()}`
    };
    
    const result = await db.collection('orders').insertOne(testOrder);
    console.log('✅ Test cash order created:', result.insertedId);
    
    // Kiểm tra lại
    const createdOrder = await db.collection('orders').findOne({ _id: result.insertedId });
    console.log('📦 Created order:', {
      id: createdOrder._id,
      finalTotal: createdOrder.finalTotal,
      paymentMethod: createdOrder.paymentMethod,
      status: createdOrder.status
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

createTestCashOrder();
