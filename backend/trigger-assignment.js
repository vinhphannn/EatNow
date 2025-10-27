const mongoose = require('mongoose');
const redis = require('redis');

const uri = 'mongodb+srv://infovinhphan_db_user:dE1Arv8M7IhQBdkH@cluster0.qwdcq4j.mongodb.net/eatnow?retryWrites=true&w=majority&appName=Cluster0';

async function triggerAssignment() {
  try {
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');
    
    const redisClient = redis.createClient({ url: 'redis://localhost:6379' });
    await redisClient.connect();
    console.log('✅ Connected to Redis');
    
    // Get pending orders
    const pendingOrders = await redisClient.sMembers('pending_orders');
    console.log('📦 Pending orders:', pendingOrders.length);
    
    if (pendingOrders.length === 0) {
      console.log('❌ No pending orders');
      return;
    }
    
    // Get first pending order
    const orderId = pendingOrders[0];
    console.log('🎯 Triggering assignment for order:', orderId);
    
    // Get order details
    const orderSchema = new mongoose.Schema({
      restaurantCoordinates: {
        latitude: Number,
        longitude: Number
      },
      driverId: mongoose.Schema.Types.ObjectId,
      status: String,
      restaurantName: String,
      recipientName: String,
      deliveryAddress: String,
      finalTotal: Number
    }, { collection: 'orders' });
    
    const Order = mongoose.model('OrderTest', orderSchema);
    const order = await Order.findById(orderId).lean();
    
    if (!order || order.driverId) {
      console.log('❌ Order not found or already assigned');
      return;
    }
    
    // Get available drivers
    const availableDrivers = await redisClient.sMembers('available_drivers');
    console.log('🚗 Available drivers:', availableDrivers.length);
    
    if (availableDrivers.length === 0) {
      console.log('❌ No available drivers');
      return;
    }
    
    // Get driver details
    const driverId = availableDrivers[0];
    const driverLocation = await redisClient.hGetAll(`driver_location:${driverId}`);
    
    if (!driverLocation.lat || !driverLocation.lng) {
      console.log('❌ Driver has no location');
      return;
    }
    
    // Calculate distance
    const lat1 = order.restaurantCoordinates.latitude;
    const lng1 = order.restaurantCoordinates.longitude;
    const lat2 = parseFloat(driverLocation.lat);
    const lng2 = parseFloat(driverLocation.lng);
    
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    console.log('📏 Distance:', distance.toFixed(2), 'km');
    
    if (distance > 10) {
      console.log('❌ Distance too far');
      return;
    }
    
    // Assign order to driver
    console.log('🔄 Assigning order to driver...');
    
    // Update order
    await Order.findByIdAndUpdate(orderId, {
      driverId: driverId,
      status: 'picking_up',
      assignedAt: new Date()
    });
    
    // Update driver
    const driverSchema = new mongoose.Schema({
      deliveryStatus: String,
      currentOrderId: mongoose.Schema.Types.ObjectId,
      activeOrdersCount: Number
    }, { collection: 'drivers' });
    
    const Driver = mongoose.model('DriverTest', driverSchema);
    await Driver.findByIdAndUpdate(driverId, {
      deliveryStatus: 'delivering',
      currentOrderId: orderId,
      $inc: { activeOrdersCount: 1 }
    });
    
    // Remove from pending orders
    await redisClient.sRem('pending_orders', orderId);
    
    console.log('✅ Order assigned successfully!');
    console.log('📦 Order:', orderId, '→ Driver:', driverId);
    console.log('🎯 Next: Driver should receive socket notification');
    
    await redisClient.disconnect();
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

triggerAssignment();
