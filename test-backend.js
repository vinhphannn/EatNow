// Test script để kiểm tra backend và CORS
const testBackend = async () => {
  const baseUrl = 'https://eatnow-wf9h.onrender.com/api/v1';
  
  console.log('🔍 Testing backend endpoints...');
  
  // Test 1: Health check
  try {
    const healthResponse = await fetch(`${baseUrl}/health`);
    console.log('✅ Health endpoint:', healthResponse.status, healthResponse.statusText);
  } catch (error) {
    console.log('❌ Health endpoint error:', error.message);
  }
  
  // Test 2: Auth me endpoint
  try {
    const authResponse = await fetch(`${baseUrl}/auth/me`, {
      method: 'GET',
      headers: {
        'Origin': 'https://eat-now.vercel.app'
      }
    });
    console.log('✅ Auth me endpoint:', authResponse.status, authResponse.statusText);
    console.log('CORS Headers:', {
      'Access-Control-Allow-Origin': authResponse.headers.get('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Credentials': authResponse.headers.get('Access-Control-Allow-Credentials')
    });
  } catch (error) {
    console.log('❌ Auth me endpoint error:', error.message);
  }
  
  // Test 3: Login endpoint
  try {
    const loginResponse = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://eat-now.vercel.app'
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'test123'
      })
    });
    console.log('✅ Login endpoint:', loginResponse.status, loginResponse.statusText);
  } catch (error) {
    console.log('❌ Login endpoint error:', error.message);
  }
};

// Chạy test
testBackend();
