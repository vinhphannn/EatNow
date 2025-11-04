// This script connects to MongoDB and drops all potentially problematic unique indexes from the 'favorites' collection.

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: './backend/.env' });

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI not found in .env file. Please check your configuration.');
    return;
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected successfully to MongoDB.');

    const database = client.db();
    const favoritesCollection = database.collection('favorites');

    console.log(`🔍 Fetching all indexes for 'favorites' collection...`);
    const indexes = await favoritesCollection.indexes();
    console.log(`Found indexes:`, indexes.map(i => i.name));

    // Define the indexes that should NOT be deleted.
    const allowedIndexes = ['_id_', 'userId_1_restaurantId_1'];

    for (const index of indexes) {
      // If the index is not in the allowed list, drop it.
      if (!allowedIndexes.includes(index.name)) {
        console.log(`🔥 Found a potentially problematic index: '${index.name}'. Attempting to drop it...`);
        try {
          await favoritesCollection.dropIndex(index.name);
          console.log(`✅ Successfully dropped index '${index.name}'.`);
        } catch (dropError) {
          console.error(`❌ Failed to drop index '${index.name}':`, dropError);
        }
      }
       else {
        console.log(`- Skipping correct index: '${index.name}'`);
      }
    }

    console.log('✨ Index cleanup process completed.');

  } catch (err) {
    console.error('❌ An error occurred during the process:', err);
  } finally {
    await client.close();
    console.log('🔚 Connection to MongoDB closed.');
  }
}

run().catch(console.dir);
