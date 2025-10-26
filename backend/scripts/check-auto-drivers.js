const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eatnow');

const driverSchema = new mongoose.Schema({
  isAuto: Boolean
}, { collection: 'drivers' });

const Driver = mongoose.model('Driver', driverSchema);

async function checkAutoDrivers() {
  try {
    console.log('Checking auto drivers...');
    
    const autoDrivers = await Driver.find({ isAuto: true }).select('_id isAuto');
    console.log(`Found ${autoDrivers.length} drivers in auto mode:`, autoDrivers);
    
    if (autoDrivers.length > 0) {
      console.log('Disabling auto mode...');
      const result = await Driver.updateMany(
        { isAuto: true },
        { $set: { isAuto: false } }
      );
      console.log(`Updated ${result.modifiedCount} drivers`);
    } else {
      console.log('No drivers in auto mode found');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkAutoDrivers();
