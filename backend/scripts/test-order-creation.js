const { MongoClient } = require('mongodb');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/eatnow';
const DB_NAME = process.env.DB_NAME || 'eatnow';

async function testOrderCreation() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('🔗 Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    const ordersCollection = db.collection('orders');
    
    // Test data với options
    const testOrder = {
      customerId: '68d3d71251d5932105560316',
      restaurantId: '68db6c57ac778a9cb703afd9',
      items: [
        {
          itemId: '68f005e86fc885dc2c188d16',
          name: 'Cơm sườn',
          price: 60000,
          quantity: 1,
          subtotal: 60000,
          totalPrice: 70000,
          options: [
            {
              optionId: 'test_option_1',
              name: 'Độ cay',
              type: 'single',
              required: true,
              choices: [
                {
                  choiceId: 'test_choice_1',
                  name: 'Cay ít',
                  price: 0,
                  quantity: 1
                }
              ],
              totalPrice: 0
            }
          ],
          specialInstructions: 'Không hành tây'
        }
      ],
      total: 70000,
      deliveryFee: 15000,
      finalTotal: 85000,
      deliveryAddress: {
        label: 'Nhà',
        addressLine: '123 Test Address',
        latitude: 10.7629,
        longitude: 106.6824,
        note: 'Test note'
      },
      recipientName: 'Test Customer',
      recipientPhonePrimary: '0123456789',
      paymentMethod: 'cash',
      status: 'pending',
      code: `TEST${Date.now()}`
    };
    
    console.log('🔍 Test order data:', JSON.stringify(testOrder, null, 2));
    
    // Insert test order
    const result = await ordersCollection.insertOne(testOrder);
    console.log('✅ Test order created with ID:', result.insertedId);
    
    // Verify the order was saved correctly
    const savedOrder = await ordersCollection.findOne({ _id: result.insertedId });
    console.log('🔍 Saved order items:', JSON.stringify(savedOrder.items, null, 2));
    
    // Check if options are saved
    if (savedOrder.items && savedOrder.items[0]) {
      console.log('🔍 First item options:', JSON.stringify(savedOrder.items[0].options, null, 2));
      console.log('🔍 First item totalPrice:', savedOrder.items[0].totalPrice);
      console.log('🔍 First item specialInstructions:', savedOrder.items[0].specialInstructions);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run test
if (require.main === module) {
  testOrderCreation()
    .then(() => {
      console.log('✅ Test completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testOrderCreation };
