const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/eatnow').then(async () => {
  const db = mongoose.connection.db;
  
  console.log('Connected to MongoDB');
  
  // Check test user
  const user = await db.collection('users').findOne({ email: 'test@example.com' });
  
  if (user) {
    console.log('Test user found:', {
      _id: user._id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      hasPassword: !!user.password
    });
  } else {
    console.log('Test user not found');
  }
  
  mongoose.disconnect();
}).catch(console.error);

