const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

async function fixDuplicateDrivers() {
  const mongoUri = process.env.MONGODB_URI;
  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    const db = client.db('eatnow');
    
    console.log('🔍 Checking for duplicate drivers...');
    
    // Tìm tất cả driver records
    const drivers = await db.collection('drivers').find({}).toArray();
    console.log('Total drivers:', drivers.length);
    
    // Nhóm theo userId
    const driverGroups = {};
    drivers.forEach(driver => {
      const userId = driver.userId.toString();
      if (!driverGroups[userId]) {
        driverGroups[userId] = [];
      }
      driverGroups[userId].push(driver);
    });
    
    // Tìm các nhóm có nhiều hơn 1 driver
    const duplicateGroups = Object.entries(driverGroups).filter(([userId, drivers]) => drivers.length > 1);
    
    console.log('Duplicate groups found:', duplicateGroups.length);
    
    for (const [userId, driverList] of duplicateGroups) {
      console.log(`\n👥 UserId ${userId} has ${driverList.length} drivers:`);
      
      // Sắp xếp theo thời gian tạo (giữ lại driver cũ nhất)
      driverList.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
      
      const keepDriver = driverList[0]; // Giữ lại driver cũ nhất
      const deleteDrivers = driverList.slice(1); // Xóa các driver còn lại
      
      console.log('✅ Keep driver:', {
        id: keepDriver._id,
        createdAt: keepDriver.createdAt,
        walletBalance: keepDriver.walletBalance || 0
      });
      
      for (const deleteDriver of deleteDrivers) {
        console.log('❌ Delete driver:', {
          id: deleteDriver._id,
          createdAt: deleteDriver.createdAt,
          walletBalance: deleteDriver.walletBalance || 0
        });
        
        // Kiểm tra xem driver có ví không
        const wallet = await db.collection('wallets').findOne({
          ownerType: 'driver',
          driverId: deleteDriver._id
        });
        
        if (wallet) {
          console.log('  💰 Found wallet for deleted driver:', {
            walletId: wallet._id,
            balance: wallet.balance,
            pendingBalance: wallet.pendingBalance
          });
          
          // Chuyển tiền từ ví của driver bị xóa sang ví của driver được giữ lại
          if (wallet.balance > 0 || wallet.pendingBalance > 0) {
            const keepWallet = await db.collection('wallets').findOne({
              ownerType: 'driver',
              driverId: keepDriver._id
            });
            
            if (keepWallet) {
              // Cộng tiền vào ví của driver được giữ lại
              await db.collection('wallets').updateOne(
                { _id: keepWallet._id },
                {
                  $inc: {
                    balance: wallet.balance,
                    pendingBalance: wallet.pendingBalance,
                    totalDeposits: wallet.totalDeposits || 0
                  }
                }
              );
              
              console.log('  💰 Transferred money to kept driver wallet');
            }
          }
          
          // Xóa ví của driver bị xóa
          await db.collection('wallets').deleteOne({ _id: wallet._id });
          console.log('  💰 Deleted wallet for removed driver');
        }
        
        // Xóa driver
        await db.collection('drivers').deleteOne({ _id: deleteDriver._id });
        console.log('  ✅ Deleted duplicate driver');
      }
    }
    
    // Tạo unique index
    console.log('\n🔧 Creating unique index for userId...');
    try {
      await db.collection('drivers').createIndex({ userId: 1 }, { unique: true });
      console.log('✅ Unique index created successfully');
    } catch (error) {
      if (error.code === 11000) {
        console.log('⚠️ Index already exists or there are still duplicates');
      } else {
        console.log('❌ Error creating index:', error.message);
      }
    }
    
    // Kiểm tra kết quả
    console.log('\n📊 Final check...');
    const finalDrivers = await db.collection('drivers').find({}).toArray();
    console.log('Total drivers after cleanup:', finalDrivers.length);
    
    // Kiểm tra duplicate
    const finalGroups = {};
    finalDrivers.forEach(driver => {
      const userId = driver.userId.toString();
      if (!finalGroups[userId]) {
        finalGroups[userId] = 0;
      }
      finalGroups[userId]++;
    });
    
    const stillDuplicates = Object.entries(finalGroups).filter(([userId, count]) => count > 1);
    if (stillDuplicates.length > 0) {
      console.log('❌ Still have duplicates:', stillDuplicates);
    } else {
      console.log('✅ No more duplicates found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fixDuplicateDrivers();
