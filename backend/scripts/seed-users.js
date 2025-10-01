const { execSync } = require('child_process');
const path = require('path');

console.log('🌱 Starting user seed...');

try {
  // Compile TypeScript first
  console.log('📦 Compiling TypeScript...');
  execSync('npm run build', { stdio: 'inherit', cwd: __dirname + '/..' });
  
  // Run seed script
  console.log('🌱 Running seed script...');
  execSync('node dist/database/seed-users.js', { stdio: 'inherit', cwd: __dirname + '/..' });
  
  console.log('✅ User seed completed successfully!');
} catch (error) {
  console.error('❌ Seed failed:', error.message);
  process.exit(1);
}
