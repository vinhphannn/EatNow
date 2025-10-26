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

async function checkUserCustomerMapping() {
  console.log('Checking user-customer mapping...');

  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/eatnow';

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected.');

    const User = mongoose.model('User', UserSchema);
    const Customer = mongoose.model('Customer', CustomerSchema);
    const Order = mongoose.model('Order', OrderSchema);

    // Get recent orders with customer info
    const recentOrders = await Order.find({})
      .populate('customerId', 'userId name email')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    console.log(`\nFound ${recentOrders.length} recent orders:`);
    
    for (const order of recentOrders) {
      console.log(`\n--- Order ${order.code || order._id} ---`);
      console.log(`Customer ID: ${order.customerId?._id}`);
      console.log(`Customer Name: ${order.customerId?.name}`);
      console.log(`Customer User ID: ${order.customerId?.userId}`);
      console.log(`Status: ${order.status}`);
      console.log(`Created: ${order.createdAt}`);
      
      // Find the user for this customer
      if (order.customerId?.userId) {
        const user = await User.findById(order.customerId.userId).lean();
        console.log(`User Name: ${user?.name}`);
        console.log(`User Email: ${user?.email}`);
        console.log(`User Role: ${user?.role}`);
      }
    }

    // Check for customers without matching users
    const customers = await Customer.find({}).lean();
    console.log(`\nChecking ${customers.length} customers for user mapping...`);
    
    let orphanedCustomers = 0;
    for (const customer of customers) {
      const user = await User.findById(customer.userId).lean();
      if (!user) {
        orphanedCustomers++;
        console.log(`❌ Orphaned customer: ${customer.name} (${customer._id}) - User ${customer.userId} not found`);
      }
    }
    
    console.log(`\nFound ${orphanedCustomers} orphaned customers`);

  } catch (error) {
    console.error('Error checking mapping:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected.');
  }
}

checkUserCustomerMapping();
