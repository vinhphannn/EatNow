const { MongoClient, ObjectId } = require('mongodb');

async function dropOldIndex() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/eatnow';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db('eatnow');
    const collection = db.collection('wallets');

    // List current indexes
    console.log('\n📋 Current indexes:');
    const indexes = await collection.indexes();
    indexes.forEach(index => {
      console.log(`  - ${index.name}:`, index.key);
    });

    // Drop the problematic index
    const indexesToDrop = [
      'type_1_ownerId_1',
      'type_1_ownerid_1',
      'type_ownerId_1'
    ];

    console.log('\n🔧 Dropping old indexes...');
    for (const indexName of indexesToDrop) {
      try {
        await collection.dropIndex(indexName);
        console.log(`✅ Dropped: ${indexName}`);
      } catch (e) {
        console.log(`⚠️ Not found: ${indexName}`);
      }
    }

    console.log('\n✅ Done!');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('✅ Closed');
  }
}

dropOldIndex()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal:', error);
    process.exit(1);
  });

