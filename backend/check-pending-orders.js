const axios = require('axios');

async function checkPendingOrders() {
  try {
    console.log('🔍 Checking pending orders...\n');
    
    // Check pending orders
    console.log('1. 📋 Checking pending orders...');
    try {
      const response = await axios.get('http://localhost:3001/api/v1/driver/test/pending-orders');
      console.log('✅ Pending orders endpoint working');
      console.log(`📊 ${response.data.data.message}`);
      console.log(`🆔 Order IDs: ${response.data.data.orders.join(', ') || 'None'}`);
      console.log(`⏰ Timestamp: ${response.data.data.timestamp}`);
    } catch (error) {
      console.log('⚠️ Pending orders endpoint failed:', error.message);
    }
    
    // Check smart assignment status
    console.log('\n2. 🤖 Checking smart assignment status...');
    try {
      const response = await axios.get('http://localhost:3001/api/v1/driver/test/smart-assignment/status');
      console.log('✅ Smart assignment status endpoint working');
      console.log(`📊 Pending orders: ${response.data.data.pendingOrders}`);
      console.log(`🚗 Available drivers: ${response.data.data.availableDrivers}`);
      console.log(`🔄 System status: ${response.data.data.systemStatus}`);
    } catch (error) {
      console.log('⚠️ Smart assignment status endpoint failed:', error.message);
    }
    
    console.log('\n3. 📝 Logs to check:');
    console.log('   • Server logs will show Redis fallback messages');
    console.log('   • Background scheduler runs every 30 seconds');
    console.log('   • Check console for "📝 [Fallback]" messages');
    
    console.log('\n🎉 Pending orders check completed!');
    
  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
}

checkPendingOrders();
