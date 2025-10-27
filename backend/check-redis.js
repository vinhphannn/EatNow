const IORedis = require('ioredis');

async function checkRedis() {
  let redis;
  
  try {
    const url = process.env.REDIS_URL || process.env.REDIS_URI || 'redis://localhost:6379';
    console.log('🔍 Connecting to Redis:', url);
    
    redis = new IORedis(url, {
      maxRetriesPerRequest: 3,
      connectTimeout: 5000,
      lazyConnect: false
    });

    // Test connection
    await redis.ping();
    console.log('✅ Redis connected successfully!\n');

    // Get all keys
    const keys = await redis.keys('*');
    console.log(`📊 Total keys in Redis: ${keys.length}\n`);

    if (keys.length === 0) {
      console.log('⚠️ No keys found. Redis might be empty or backend hasn\'t started yet.');
      process.exit(0);
    }

    // Group keys by prefix
    const grouped = {};
    keys.forEach(key => {
      const prefix = key.split(':')[0];
      if (!grouped[prefix]) grouped[prefix] = [];
      grouped[prefix].push(key);
    });

    // Display grouped keys
    console.log('🔑 Redis Keys by prefix:');
    Object.keys(grouped).sort().forEach(prefix => {
      console.log(`\n${prefix}:`);
      grouped[prefix].forEach(key => {
        console.log(`  - ${key}`);
      });
    });

    // Check specific keys for driver/order assignment
    console.log('\n🎯 Driver & Order Assignment Status:\n');

    // Driver available geo
    const geoCount = await redis.zcard('driver:available:geo');
    console.log(`📍 Drivers in Redis GEO: ${geoCount}`);
    if (geoCount > 0) {
      const drivers = await redis.zrange('driver:available:geo', 0, -1, 'WITHSCORES');
      console.log(`   Driver IDs:`, drivers.filter((_, i) => i % 2 === 0));
    }

    // Order queue
    const queueCount = await redis.zcard('order:queue:ready');
    console.log(`📦 Orders in queue: ${queueCount}`);
    if (queueCount > 0) {
      const orders = await redis.zrange('order:queue:ready', 0, 9);
      console.log(`   First 10 orders:`, orders);
    }

    // Driver available set
    const availableCount = await redis.scard('driver:available:set');
    console.log(`🚗 Available drivers (set): ${availableCount}`);

    // Check some specific drivers
    const driverKeys = keys.filter(k => k.startsWith('driver:presence:'));
    if (driverKeys.length > 0) {
      console.log('\n📋 Driver Presence Data:');
      for (const key of driverKeys.slice(0, 3)) {
        const presence = await redis.get(key);
        console.log(`  ${key}:`, presence);
      }
    }

  } catch (error) {
    console.error('❌ Redis Error:', error.message);
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Tip: Make sure Redis is running:');
      console.log('   - Start Redis server');
      console.log('   - Check REDIS_URL environment variable');
    }
  } finally {
    if (redis) {
      await redis.quit();
      console.log('\n✅ Redis connection closed');
    }
  }
}

checkRedis();

