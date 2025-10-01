// Script để kiểm tra JWT token
const jwt = require('jsonwebtoken');

// Giả sử bạn có token từ localStorage
// Bạn cần copy token từ browser console: localStorage.getItem('eatnow_token')

const token = process.argv[2]; // Lấy token từ command line argument

if (!token) {
  console.log('❌ Vui lòng cung cấp JWT token:');
  console.log('node check-jwt-token.js YOUR_JWT_TOKEN_HERE');
  console.log('');
  console.log('Để lấy token:');
  console.log('1. Mở browser console (F12)');
  console.log('2. Gõ: localStorage.getItem("eatnow_token")');
  console.log('3. Copy token và chạy script');
  process.exit(1);
}

try {
  // Decode JWT token (không cần secret để decode)
  const decoded = jwt.decode(token);
  
  console.log('🔍 JWT Token Analysis:');
  console.log('- User ID:', decoded.sub || decoded.id);
  console.log('- Email:', decoded.email);
  console.log('- Role:', decoded.role);
  console.log('- Issued At:', new Date(decoded.iat * 1000));
  console.log('- Expires At:', new Date(decoded.exp * 1000));
  console.log('- Is Expired:', new Date() > new Date(decoded.exp * 1000));
  console.log('');
  
  console.log('📋 Full Token Payload:');
  console.log(JSON.stringify(decoded, null, 2));
  
} catch (error) {
  console.error('❌ Error decoding token:', error.message);
}






