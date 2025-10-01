const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/eatnow').then(async () => {
  const db = mongoose.connection.db;
  
  console.log('Connected to MongoDB');
  
  // Check test user with exact email
  const user = await db.collection('users').findOne({ email: 'test@example.com' });
  console.log('User with exact email:', user ? 'Found' : 'Not found');
  
  // Check test user with lowercase email
  const userLower = await db.collection('users').findOne({ email: 'test@example.com' });
  console.log('User with lowercase email:', userLower ? 'Found' : 'Not found');
  
  // Check all users with test email
  const allUsers = await db.collection('users').find({ email: { $regex: /test@example.com/i } }).toArray();
  console.log('All users with test email (case insensitive):', allUsers.length);
  
  if (allUsers.length > 0) {
    allUsers.forEach(user => {
      console.log('User email:', user.email);
    });
  }
  
  mongoose.disconnect();
}).catch(console.error);






























