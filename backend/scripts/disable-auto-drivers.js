const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eatnow', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const driverSchema = new mongoose.Schema({
  isAuto: Boolean
}, { collection: 'drivers' });

const Driver = mongoose.model('Driver', driverSchema);

async function disableAutoDrivers() {
  try {
    console.log('Disabling auto mode for all drivers...');
    
    const result = await Driver.updateMany(
      { isAuto: true },
      { $set: { isAuto: false } }
    );
    
    console.log(`Updated ${result.modifiedCount} drivers to disable auto mode`);
    
    // Check if any drivers are still in auto mode
    const autoDrivers = await Driver.countDocuments({ isAuto: true });
    console.log(`Remaining auto drivers: ${autoDrivers}`);
    
    if (autoDrivers === 0) {
      console.log('✅ All drivers are now in manual mode');
    } else {
      console.log('⚠️ Some drivers are still in auto mode');
    }
    
  } catch (error) {
    console.error('Error disabling auto drivers:', error);
  } finally {
    mongoose.connection.close();
  }
}

disableAutoDrivers();
