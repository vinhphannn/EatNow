const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eatnow');

// Customer schema (simplified for testing)
const customerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  addresses: [{
    label: String,
    addressLine: String,
    latitude: Number,
    longitude: Number,
    note: String,
    isDefault: Boolean,
    phone: String,
    recipientName: String,
    isActive: Boolean
  }],
  addressLabels: [String]
}, { timestamps: true });

const Customer = mongoose.model('Customer', customerSchema);

async function clearTestAddresses() {
  try {
    console.log('🧹 Clearing test address data...');
    
    const customer = await Customer.findOne();
    if (customer) {
      customer.addresses = [];
      customer.addressLabels = ['Nhà', 'Chỗ làm', 'Nhà bạn', 'Khác'];
      await customer.save();
      console.log('✅ Cleared test addresses - now using real data from API');
    } else {
      console.log('❌ No customer found');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

clearTestAddresses();
