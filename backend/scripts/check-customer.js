const mongoose = require('mongoose');

// Define schemas directly since we can't import TypeScript files
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

async function checkCustomer() {
  console.log('Checking customer profiles...');

  // Replace with your MongoDB connection string
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/eatnow';

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected.');

    const Customer = mongoose.model('Customer', CustomerSchema);

    const customers = await Customer.find({}).lean();
    console.log(`Found ${customers.length} customers:`);
    
    customers.forEach(customer => {
      console.log(`- Customer ID: ${customer._id}, User ID: ${customer.userId}, Name: ${customer.name}`);
    });

    // Check for recent orders
    const Order = mongoose.model('Order', OrderSchema);
    
    const recentOrders = await Order.find({}).sort({ createdAt: -1 }).limit(5).lean();
    console.log(`\nFound ${recentOrders.length} recent orders:`);
    
    recentOrders.forEach(order => {
      console.log(`- Order ID: ${order._id}, Code: ${order.code}, Customer ID: ${order.customerId}, Status: ${order.status}`);
    });

  } catch (error) {
    console.error('Error checking customers:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected.');
  }
}

checkCustomer();
