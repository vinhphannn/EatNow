// Script để kiểm tra đơn hàng trong database
const mongoose = require('mongoose');

// Order Schema (simplified)
const orderSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  items: [{
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    subtotal: { type: Number, required: true }
  }],
  total: { type: Number, required: true },
  deliveryFee: { type: Number, required: true },
  finalTotal: { type: Number, required: true },
  deliveryAddress: {
    label: { type: String, required: true },
    addressLine: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    note: { type: String }
  },
  specialInstructions: { type: String, default: '' },
  paymentMethod: { type: String, enum: ['cash', 'bank_transfer'], required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'], default: 'pending' },
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  estimatedDeliveryTime: { type: Date },
  actualDeliveryTime: { type: Date },
  distanceToRestaurant: { type: Number },
  distanceToCustomer: { type: Number },
  deliveryDistance: { type: Number }, // ⭐ KHOẢNG CÁCH GIAO HÀNG
  assignedAt: { type: Date },
  driverRating: { type: Number },
  code: { type: String, unique: true, sparse: true },
  trackingHistory: [{
    status: { type: String, required: true },
    timestamp: { type: Date, required: true },
    note: { type: String },
    updatedBy: { type: String }
  }]
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);

async function checkOrders() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/eatnow', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('🔗 Connected to MongoDB');
    
    // Get recent orders
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('customerId', 'name email')
      .populate('restaurantId', 'name address')
      .populate('driverId', 'name phone');
    
    console.log(`📋 Found ${recentOrders.length} recent orders:`);
    
    recentOrders.forEach((order, index) => {
      console.log(`\n--- Order ${index + 1} ---`);
      console.log(`🆔 Code: ${order.code || 'N/A'}`);
      console.log(`👤 Customer: ${order.customerId?.name || 'N/A'}`);
      console.log(`🏪 Restaurant: ${order.restaurantId?.name || 'N/A'}`);
      console.log(`🚚 Driver: ${order.driverId?.name || 'Chưa giao'}`);
      console.log(`📍 Status: ${order.status}`);
      console.log(`💰 Total: ${order.finalTotal?.toLocaleString('vi-VN')}đ`);
      console.log(`🚚 Delivery Fee: ${order.deliveryFee?.toLocaleString('vi-VN')}đ`);
      console.log(`📏 Delivery Distance: ${order.deliveryDistance || 'N/A'}km`);
      console.log(`🏠 Address: ${order.deliveryAddress?.addressLine || 'N/A'}`);
      console.log(`📅 Created: ${order.createdAt}`);
    });
    
    // Statistics
    const totalOrders = await Order.countDocuments();
    const ordersWithDistance = await Order.countDocuments({ deliveryDistance: { $exists: true, $ne: null } });
    const avgDeliveryDistance = await Order.aggregate([
      { $match: { deliveryDistance: { $exists: true, $ne: null } } },
      { $group: { _id: null, avgDistance: { $avg: '$deliveryDistance' } } }
    ]);
    
    console.log('\n📊 Statistics:');
    console.log(`📦 Total Orders: ${totalOrders}`);
    console.log(`📏 Orders with Distance: ${ordersWithDistance}`);
    if (avgDeliveryDistance.length > 0) {
      console.log(`📐 Average Delivery Distance: ${avgDeliveryDistance[0].avgDistance.toFixed(2)}km`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run check
checkOrders();






