const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

mongoose.connect('mongodb://localhost:27017/eatnow').then(async () => {
  const db = mongoose.connection.db;
  
  console.log('Connected to MongoDB');
  
  // Delete existing test user
  await db.collection('users').deleteOne({ email: 'test@example.com' });
  
  // Create new test user with correct password hash
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const user = {
    email: 'test@example.com'.toLowerCase(),
    password: hashedPassword,
    name: 'Test User',
    fullName: 'Test User',
    phone: '0123456789',
    role: 'customer',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  try {
    const result = await db.collection('users').insertOne(user);
    console.log('New test user created:', result.insertedId);
    
    // Verify password
    const testPassword = await bcrypt.compare('password123', hashedPassword);
    console.log('Password verification:', testPassword);
    
  } catch (error) {
    console.error('Error creating user:', error);
  }
  
  mongoose.disconnect();
}).catch(console.error);
