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

async function debugOrderIssue() {
  console.log('Debugging order issue...');

  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/eatnow';

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected.');

    const User = mongoose.model('User', UserSchema);
    const Customer = mongoose.model('Customer', CustomerSchema);
    const Order = mongoose.model('Order', OrderSchema);

    // Find the specific order
    const order = await Order.findOne({ code: 'ORD93177719C0' }).lean();
    if (order) {
      console.log('\n--- Found Order ORD93177719C0 ---');
      console.log(`Order ID: ${order._id}`);
      console.log(`Customer ID: ${order.customerId}`);
      console.log(`Status: ${order.status}`);
      console.log(`Created: ${order.createdAt}`);
      
      // Find customer
      const customer = await Customer.findById(order.customerId).lean();
      if (customer) {
        console.log(`\n--- Customer Info ---`);
        console.log(`Customer Name: ${customer.name}`);
        console.log(`Customer User ID: ${customer.userId}`);
        
        // Find user
        const user = await User.findById(customer.userId).lean();
        if (user) {
          console.log(`\n--- User Info ---`);
          console.log(`User Name: ${user.name}`);
          console.log(`User Email: ${user.email}`);
          console.log(`User Role: ${user.role}`);
        } else {
          console.log('❌ User not found!');
        }
      } else {
        console.log('❌ Customer not found!');
      }
    } else {
      console.log('❌ Order ORD93177719C0 not found!');
    }

    // Check all orders for this customer
    if (order && order.customerId) {
      console.log(`\n--- All orders for customer ${order.customerId} ---`);
      const customerOrders = await Order.find({ customerId: order.customerId })
        .sort({ createdAt: -1 })
        .lean();
      
      console.log(`Found ${customerOrders.length} orders:`);
      customerOrders.forEach(o => {
        console.log(`- ${o.code || o._id}: ${o.status} (${o.createdAt})`);
      });
    }

    // Check if there are any orders with ORD0001 pattern
    console.log(`\n--- Looking for ORD0001 pattern ---`);
    const ord0001Orders = await Order.find({ code: /^ORD0001/ }).lean();
    console.log(`Found ${ord0001Orders.length} orders with ORD0001 pattern:`);
    ord0001Orders.forEach(o => {
      console.log(`- ${o.code}: ${o.status} (${o.createdAt})`);
    });

  } catch (error) {
    console.error('Error debugging:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected.');
  }
}

debugOrderIssue();
