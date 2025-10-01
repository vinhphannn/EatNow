const jwt = require('jsonwebtoken');

// Test user data
const user = {
  id: '68c004a1ec347ba86c990a5f',
  email: 'HANG8@GMAIL.COM',
  role: 'restaurant'
};

// Create new token
const token = jwt.sign(user, 'your-secret-key', { expiresIn: '24h' });

console.log('New test token:');
console.log(token);
console.log('\nDecoded payload:');
console.log(jwt.decode(token));

// Test if token is valid
try {
  const decoded = jwt.verify(token, 'your-secret-key');
  console.log('\nToken is valid!');
  console.log('User ID:', decoded.id);
  console.log('Email:', decoded.email);
  console.log('Role:', decoded.role);
} catch (error) {
  console.log('Token verification failed:', error.message);
}


