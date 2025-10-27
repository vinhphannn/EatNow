const mongoose = require('mongoose');
const redis = require('redis');

const uri = 'mongodb+srv://infovinhphan_db_user:dE1Arv8M7IhQBdkH@cluster0.qwdcq4j.mongodb.net/eatnow?retryWrites=true&w=majority&appName=Cluster0';

async function testAssignmentService() {
  try {
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');
    
    const redisClient = redis.createClient({ url: 'redis://localhost:6379' });
    await redisClient.connect();
    console.log('✅ Connected to Redis');
    
    // Simulate the assignment service logic
    console.log('🔄 Starting assignment process...');
    
    // Get pending orders
    const pendingOrders = await redisClient.sMembers('pending_orders');
    console.log('📦 Pending orders:', pendingOrders.length);
    
    if (pendingOrders.length === 0) {
      console.log('❌ No pending orders to process');
      return;
    }
    
    // Get available drivers
    const availableDrivers = await redisClient.sMembers('available_drivers');
    console.log('🚗 Available drivers:', availableDrivers.length);
    
    if (availableDrivers.length === 0) {
      console.log('❌ No available drivers');
      return;
    }
    
    // Process each pending order
    for (const orderId of pendingOrders.slice(0, 3)) { // Test first 3 orders
      console.log(`\n🎯 Processing order: ${orderId}`);
      
      // Get order details
      const orderSchema = new mongoose.Schema({
        restaurantCoordinates: {
          latitude: Number,
          longitude: Number
        },
        driverId: mongoose.Schema.Types.ObjectId,
        status: String
      }, { collection: 'orders' });
      
      const Order = mongoose.model('OrderTest', orderSchema);
      const order = await Order.findById(orderId).lean();
      
      if (!order) {
        console.log('❌ Order not found');
        continue;
      }
      
      if (order.driverId) {
        console.log('⚠️ Order already has driver');
        continue;
      }
      
      if (!order.restaurantCoordinates || !order.restaurantCoordinates.latitude || !order.restaurantCoordinates.longitude) {
        console.log('❌ Order missing restaurant coordinates');
        continue;
      }
      
      console.log('📍 Restaurant coordinates:', order.restaurantCoordinates);
      
      // Find best driver
      let bestDriver = null;
      let bestScore = -1;
      
      for (const driverId of availableDrivers) {
        const driverLocation = await redisClient.hGetAll(`driver_location:${driverId}`);
        
        if (!driverLocation.lat || !driverLocation.lng) {
          console.log(`❌ Driver ${driverId} has no location`);
          continue;
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
        
        console.log(`📏 Driver ${driverId} distance: ${distance.toFixed(2)}km`);
        
        if (distance > 10) {
          console.log(`❌ Driver ${driverId} too far`);
          continue;
        }
        
        // Simple scoring (distance only for now)
        const score = Math.max(0, 1 - (distance / 10));
        
        if (score > bestScore) {
          bestScore = score;
          bestDriver = { id: driverId, distance, score };
        }
      }
      
      if (!bestDriver) {
        console.log('❌ No suitable driver found');
        continue;
      }
      
      console.log(`✅ Best driver: ${bestDriver.id}, distance: ${bestDriver.distance.toFixed(2)}km, score: ${bestDriver.score.toFixed(2)}`);
      
      // Assign order
      console.log('🔄 Assigning order...');
      
      // Update order
      await Order.findByIdAndUpdate(orderId, {
        driverId: bestDriver.id,
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
      await Driver.findByIdAndUpdate(bestDriver.id, {
        deliveryStatus: 'delivering',
        currentOrderId: orderId,
        $inc: { activeOrdersCount: 1 }
      });
      
      // Remove from pending orders
      await redisClient.sRem('pending_orders', orderId);
      
      // Remove driver from available
      await redisClient.sRem('available_drivers', bestDriver.id);
      
      console.log(`✅ Order ${orderId} assigned to driver ${bestDriver.id}`);
      
      // Only assign one order for testing
      break;
    }
    
    await redisClient.disconnect();
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

testAssignmentService();
