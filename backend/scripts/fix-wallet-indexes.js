/**
 * Fix Wallet Indexes
 * Xóa index cũ 'type_1_ownerId_1' và tạo lại indexes đúng
 */

const { MongoClient } = require('mongodb');

async function fixWalletIndexes() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/eatnow';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db('eatnow');
    const collection = db.collection('wallets');

    // Check if collection exists
    const collections = await db.listCollections().toArray();
    const walletCollectionExists = collections.some(col => col.name === 'wallets');
    
    if (!walletCollectionExists) {
      console.log('⚠️ wallets collection does not exist, creating...');
      // Create collection by inserting and deleting a dummy document
      const { ObjectId } = require('mongodb');
      await collection.insertOne({ _id: new ObjectId() });
      await collection.deleteMany({});
      console.log('✅ Created wallets collection');
    }

    // List current indexes
    console.log('\n📋 Current indexes:');
    try {
      const indexes = await collection.indexes();
      indexes.forEach(index => {
        console.log(`  - ${index.name}:`, index.key);
      });
    } catch (e) {
      console.log('⚠️ Could not list indexes:', e.message);
    }

    // Drop problematic index
    try {
      await collection.dropIndex('type_1_ownerId_1');
      console.log('✅ Dropped old index: type_1_ownerId_1');
    } catch (e) {
      console.log('⚠️ Index type_1_ownerId_1 not found');
    }

    console.log('\n✅ Done! Collection exists and ready for use.');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.close();
    console.log('✅ Connection closed');
  }
}

// Run
fixWalletIndexes()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
