const mongoose = require('mongoose');

// Define schemas
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['customer', 'restaurant', 'driver', 'admin'], default: 'customer' },
  phone: { type: String },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const CustomerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  address: { type: String },
  dateOfBirth: { type: Date },
  gender: { type: String, enum: ['male', 'female', 'other'] },
  preferences: {
    dietaryRestrictions: [String],
    favoriteCuisines: [String],
    deliveryInstructions: String
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const CartSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
  quantity: { type: Number, required: true, default: 1 },
  specialInstructions: { type: String, default: '' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const OrderSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
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
  recipientName: { type: String, default: '' },
  recipientPhonePrimary: { type: String, default: '' },
  recipientPhoneSecondary: { type: String, default: '' },
  purchaserPhone: { type: String, default: '' },
  paymentMethod: { type: String, enum: ['cash', 'bank_transfer'], required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'], default: 'pending' },
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  estimatedDeliveryTime: { type: Date },
  actualDeliveryTime: { type: Date },
  distanceToRestaurant: { type: Number },
  distanceToCustomer: { type: Number },
  deliveryDistance: { type: Number },
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

async function checkCart() {
  console.log('Checking cart data...');

  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/eatnow';

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected.');

    const User = mongoose.model('User', UserSchema);
    const Customer = mongoose.model('Customer', CustomerSchema);
    const Cart = mongoose.model('Cart', CartSchema);
    const Order = mongoose.model('Order', OrderSchema);

    // Get recent orders
    const recentOrders = await Order.find({})
      .populate('customerId', 'userId name email')
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();

    console.log(`\n--- Recent Orders ---`);
    recentOrders.forEach(order => {
      console.log(`Order ${order.code}: Customer ${order.customerId?.name} (${order.customerId?.userId})`);
    });

    // Check carts for recent customers
    for (const order of recentOrders) {
      if (order.customerId?.userId) {
        console.log(`\n--- Cart for Customer ${order.customerId.name} (User: ${order.customerId.userId}) ---`);
        
        const cartItems = await Cart.find({ 
          userId: order.customerId.userId, 
          isActive: true 
        }).lean();
        
        console.log(`Active cart items: ${cartItems.length}`);
        cartItems.forEach(item => {
          console.log(`- Item ${item.itemId}: Quantity ${item.quantity}`);
        });
      }
    }

    // Check all active carts
    console.log(`\n--- All Active Carts ---`);
    const allCarts = await Cart.find({ isActive: true })
      .populate('userId', 'name email')
      .lean();
    
    console.log(`Total active cart items: ${allCarts.length}`);
    allCarts.forEach(item => {
      console.log(`- User ${item.userId?.name}: Item ${item.itemId}, Quantity ${item.quantity}`);
    });

  } catch (error) {
    console.error('Error checking cart:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected.');
  }
}

checkCart();






















