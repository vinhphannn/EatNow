const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  phone: { type: String },
  role: { 
    type: String, 
    enum: ['admin', 'customer', 'driver', 'restaurant'], 
    required: true 
  },
  avatarUrl: { type: String },
  addresses: [{
    label: { type: String, required: true },
    addressLine: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
    note: { type: String },
    isDefault: { type: Boolean, default: false },
  }],
  addressLabels: { 
    type: [String], 
    default: ['Nhà', 'Chỗ làm', 'Nhà mẹ chồng'] 
  }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function createAdmin() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://infovinhphan_db_user:dE1Arv8M7IhQBdkH@cluster0.qwdcq4j.mongodb.net/eatnow?retryWrites=true&w=majority&appName=Cluster0';
    
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@eatnow.com' });
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists!');
      console.log('📧 Email:', existingAdmin.email);
      console.log('👤 Name:', existingAdmin.name);
      console.log('🔑 Role:', existingAdmin.role);
      console.log('📅 Created:', existingAdmin.createdAt);
      
      // Update password if needed
      const passwordMatch = await bcrypt.compare('admin123', existingAdmin.password);
      if (!passwordMatch) {
        console.log('🔄 Updating admin password...');
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await User.findByIdAndUpdate(existingAdmin._id, { password: hashedPassword });
        console.log('✅ Admin password updated successfully!');
      } else {
        console.log('✅ Admin password is correct');
      }
    } else {
      // Create new admin user
      console.log('👤 Creating new admin user...');
      
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      const adminUser = new User({
        email: 'admin@eatnow.com',
        password: hashedPassword,
        name: 'Admin User',
        role: 'admin',
        phone: '+84 123 456 789'
      });

      await adminUser.save();
      console.log('✅ Admin user created successfully!');
      console.log('📧 Email:', adminUser.email);
      console.log('👤 Name:', adminUser.name);
      console.log('🔑 Role:', adminUser.role);
      console.log('🆔 ID:', adminUser._id);
    }

    // Create demo users for other roles
    console.log('\n🎭 Creating demo users for other roles...');
    
    const demoUsers = [
      {
        email: 'restaurant@eatnow.com',
        password: 'restaurant123',
        name: 'Nhà hàng ABC',
        role: 'restaurant',
        phone: '+84 987 654 321'
      },
      {
        email: 'driver@eatnow.com',
        password: 'driver123',
        name: 'Tài xế Nguyễn Văn A',
        role: 'driver',
        phone: '+84 555 123 456'
      },
      {
        email: 'customer@eatnow.com',
        password: 'customer123',
        name: 'Khách hàng Nguyễn Thị B',
        role: 'customer',
        phone: '+84 111 222 333'
      }
    ];

    for (const userData of demoUsers) {
      const existingUser = await User.findOne({ email: userData.email });
      
      if (existingUser) {
        console.log(`⚠️  ${userData.role} user already exists: ${userData.email}`);
        
        // Update password if needed
        const passwordMatch = await bcrypt.compare(userData.password, existingUser.password);
        if (!passwordMatch) {
          const hashedPassword = await bcrypt.hash(userData.password, 10);
          await User.findByIdAndUpdate(existingUser._id, { password: hashedPassword });
          console.log(`✅ ${userData.role} password updated`);
        }
      } else {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        const user = new User({
          ...userData,
          password: hashedPassword
        });
        
        await user.save();
        console.log(`✅ ${userData.role} user created: ${userData.email}`);
      }
    }

    console.log('\n🎉 All users created/updated successfully!');
    console.log('\n📋 Demo Credentials:');
    console.log('┌─────────────────────┬─────────────────────┬─────────────────────┐');
    console.log('│ Role                │ Email               │ Password            │');
    console.log('├─────────────────────┼─────────────────────┼─────────────────────┤');
    console.log('│ Admin               │ admin@eatnow.com    │ admin123            │');
    console.log('│ Restaurant          │ restaurant@eatnow.com│ restaurant123       │');
    console.log('│ Driver              │ driver@eatnow.com   │ driver123           │');
    console.log('│ Customer            │ customer@eatnow.com │ customer123         │');
    console.log('└─────────────────────┴─────────────────────┴─────────────────────┘');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
createAdmin();
