const mongoose = require('mongoose');

const uri = 'mongodb+srv://infovinhphan_db_user:dE1Arv8M7IhQBdkH@cluster0.qwdcq4j.mongodb.net/eatnow?retryWrites=true&w=majority&appName=Cluster0';

async function checkDriverOrder() {
  try {
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');
    
    const orderId = '68ff3de109684bf8869cc513';
    const driverId = '68e4efc87d83a75499133e17';
    
    const orderSchema = new mongoose.Schema({
      driverId: mongoose.Schema.Types.ObjectId,
      status: String
    }, { collection: 'orders' });
    
    const Order = mongoose.model('OrderTest', orderSchema);
    
    // Check if order exists
    const order = await Order.findById(orderId).lean();
    console.log('🔍 Order:', order ? 'Found' : 'Not found');
    if (order) {
      console.log('📍 Order driverId:', order.driverId);
      console.log('📍 Order status:', order.status);
      console.log('📍 Expected driverId:', driverId);
      console.log('📍 Match:', String(order.driverId) === driverId);
    }
    
    // Check if driverId in order matches driver _id
    const orders = await Order.find({
      driverId: new mongoose.Types.ObjectId(driverId),
      status: { $nin: ['delivered', 'cancelled'] }
    }).lean();
    
    console.log('📦 Orders with driverId:', orders.length);
    if (orders.length > 0) {
      console.log('📍 Order IDs:', orders.map(o => o._id));
      console.log('📍 Order statuses:', orders.map(o => o.status));
    }
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkDriverOrder();
