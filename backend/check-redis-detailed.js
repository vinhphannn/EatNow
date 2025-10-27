const IORedis = require('ioredis');

async function checkRedisDetailed() {
  let redis;
  
  try {
    const url = process.env.REDIS_URL || process.env.REDIS_URI || 'redis://localhost:6379';
    console.log('🔍 Connecting to Redis:', url);
    
    redis = new IORedis(url, {
      maxRetriesPerRequest: 3,
      connectTimeout: 5000,
      lazyConnect: false
    });

    await redis.ping();
    console.log('✅ Redis connected successfully!\n');

    // Get all keys
    const keys = await redis.keys('*');
    console.log(`📊 Total keys in Redis: ${keys.length}\n`);

    // Check each key
    for (const key of keys) {
      console.log(`\n🔑 Key: ${key}`);
      console.log(`   Type: ${await redis.type(key)}`);
      
      const type = await redis.type(key);
      
      if (type === 'string') {
        const value = await redis.get(key);
        console.log(`   Value: ${value}`);
      } else if (type === 'set') {
        const members = await redis.smembers(key);
        console.log(`   Members (${members.length}):`, members);
      } else if (type === 'zset') {
        const count = await redis.zcard(key);
        console.log(`   Count: ${count}`);
        if (count > 0) {
          const range = await redis.zrange(key, 0, 9);
          console.log(`   First 10:`, range);
        }
      } else if (type === 'list') {
        const length = await redis.llen(key);
        console.log(`   Length: ${length}`);
        if (length > 0) {
          const range = await redis.lrange(key, 0, 9);
          console.log(`   First 10:`, range);
        }
      } else if (type === 'hash') {
        const fields = await redis.hgetall(key);
        console.log(`   Fields:`, Object.keys(fields));
        if (Object.keys(fields).length <= 10) {
          console.log(`   Data:`, fields);
        }
      }
    }

  } catch (error) {
    console.error('❌ Redis Error:', error.message);
  } finally {
    if (redis) {
      await redis.quit();
    }
  }
}

checkRedisDetailed();

