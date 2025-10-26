const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Redis server...');

// Tìm redis-server executable
const redisServer = require('redis-server');
const server = new redisServer({
  port: 6379,
  host: 'localhost'
});

server.open((err) => {
  if (err) {
    console.error('❌ Failed to start Redis:', err);
    process.exit(1);
  }
  console.log('✅ Redis server started on port 6379');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 Shutting down Redis server...');
  server.close(() => {
    console.log('✅ Redis server stopped');
    process.exit(0);
  });
});
