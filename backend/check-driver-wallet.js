const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

async function checkDriverWallet() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
  console.log('🔗 Using MongoDB URI:', mongoUri);
  
  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    const db = client.db('eatnow');
    
    // Tìm tất cả driver
    const drivers = await db.collection('drivers').find({}).toArray();
    console.log('🔍 Found drivers:', drivers.length);
    
    for (const driver of drivers) {
      console.log(`\n📋 Driver: ${driver.name || 'Unknown'} (ID: ${driver._id})`);
      
      // Tìm ví của driver
      const wallet = await db.collection('wallets').findOne({
        ownerType: 'driver',
        driverId: driver._id,
        isActive: true
      });
      
      if (wallet) {
        console.log(`  💰 Wallet found:`, {
          walletId: wallet._id,
          balance: wallet.balance,
          pendingBalance: wallet.pendingBalance,
          escrowBalance: wallet.escrowBalance,
          totalDeposits: wallet.totalDeposits,
          totalWithdrawals: wallet.totalWithdrawals
        });
      } else {
        console.log(`  ❌ No wallet found for driver ${driver._id}`);
      }
    }
    
    // Tìm tất cả ví driver
    const driverWallets = await db.collection('wallets').find({
      ownerType: 'driver'
    }).toArray();
    
    console.log(`\n🔍 All driver wallets:`, driverWallets.length);
    for (const wallet of driverWallets) {
      console.log(`  💰 Wallet:`, {
        walletId: wallet._id,
        driverId: wallet.driverId,
        balance: wallet.balance,
        isActive: wallet.isActive
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

checkDriverWallet();
