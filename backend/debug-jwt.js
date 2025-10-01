const jwt = require('jsonwebtoken');

// Test JWT token (you can get this from browser localStorage)
const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4YzAwNGExZWMzNDdiYTg2Yzk5MGE1ZiIsImVtYWlsIjoiSEFORzhAR01BSUwuQ09NIiwicm9sZSI6InJlc3RhdXJhbnQiLCJpYXQiOjE3MzY5MjEwMjIsImV4cCI6MTczNjk1NzAyMn0.4J8K9L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6A7B8C9D0E1F2G3H4I5J6K7L8M9N0O1P2Q3R4S5T6U7V8W9X0Y1Z2';

try {
  const decoded = jwt.decode(testToken);
  console.log('🔍 Decoded JWT token:');
  console.log('  ID:', decoded.id);
  console.log('  Email:', decoded.email);
  console.log('  Role:', decoded.role);
  console.log('  Issued at:', new Date(decoded.iat * 1000));
  console.log('  Expires at:', new Date(decoded.exp * 1000));
  
  // Check if token is expired
  const now = Math.floor(Date.now() / 1000);
  if (decoded.exp < now) {
    console.log('⚠️ Token is EXPIRED!');
  } else {
    console.log('✅ Token is valid');
  }
} catch (error) {
  console.error('Error decoding token:', error);
}


