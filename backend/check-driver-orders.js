const mongoose = require('mongoose');

const uri = 'mongodb+srv://infovinhphan_db_user:dE1Arv8M7IhQBdkH@cluster0.qwdcq4j.mongodb.net/eatnow?retryWrites=true&w=majority&appName=Cluster0';

async function checkDriverOrders() {
  try {
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');
    
    // Driver info from user's log
    const currentOrderId = '68ff3de109684bf8869cc513';
    const driverId = '68e4efc87d83a75499133e17';
    
    console.log('🔍 Checking driver orders...');
    console.log('📍 currentOrderId:', currentOrderId);
    console.log('📍 driverId:', driverId);
    
    // Check order with currentOrderId
    const orderSchema = new mongoose.Schema({
      _id: mongoose.Schema.Types.ObjectId,
      driverId: mongoose.Schema.Types.ObjectId,
      status: String
    }, { collection: 'orders' });
    
    const Order = mongoose.model('OrderTest', orderSchema);
    
    const order = await Order.findById(currentOrderId).lean();
    console.log('🔍 Order found:', !!order);
    if (order) {
      console.log('📍 Order driverId:', order.driverId);
      console.log('📍 Order status:', order.status);
      console.log('📍 Match with driver _id:', String(order.driverId) === driverId);
    }
    
    // Find all orders with this driverId
    const orders = await Order.find({
      driverId: new mongoose.Types.ObjectId(driverId)
    }).lean();
    
    console.log('📦 All orders with driverId:', orders.length);
    if (orders.length > 0) {
      orders.forEach(o => {
        console.log('  - Order:', o._id, 'Status:', o.status);
      });
    }
    
    // Find incomplete orders
    const incompleteOrders = await Order.find({
      driverId: new mongoose.Types.ObjectId(driverId),
      status: { $nin: ['delivered', 'cancelled'] }
    }).lean();
    
    console.log('📦 Incomplete orders:', incompleteOrders.length);
    if (incompleteOrders.length > 0) {
      incompleteOrders.forEach(o => {
        console.log('  - Incomplete Order:', o._id, 'Status:', o.status);
      });
    }
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

checkDriverOrders();
