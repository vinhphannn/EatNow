const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'customer', 'restaurant', 'driver'], default: 'customer' },
  name: { type: String },
  fullName: { type: String },
  phone: { type: String },
  avatarUrl: { type: String },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

async function createCustomer() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb+srv://zinh:zinh123@cluster0.7j7ml.mongodb.net/eatnow?retryWrites=true&w=majority');
    console.log('Connected to MongoDB');

    // Check if customer already exists
    const existingCustomer = await User.findOne({ email: 'customer@eatnow.com' });
    if (existingCustomer) {
      console.log('Customer already exists:', existingCustomer.email);
      await mongoose.disconnect();
      return;
    }

    // Create customer
    const hashedPassword = await bcrypt.hash('customer123', 10);
    const customer = new User({
      email: 'customer@eatnow.com',
      password: hashedPassword,
      role: 'customer',
      name: 'Khách hàng demo',
      fullName: 'Khách hàng demo',
      phone: '0123456789',
      isActive: true
    });

    await customer.save();
    console.log('Customer created successfully:', customer.email);

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error creating customer:', error);
    await mongoose.disconnect();
  }
}

createCustomer();
