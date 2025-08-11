const cron = require('node-cron');
const Event = require('../models/Event');

const startEventStatusUpdater = () => {
  // This cron job is scheduled to run once every hour.
  cron.schedule('0 * * * *', async () => {
    console.log('🕒 Running hourly check for event registration deadlines...');
    try {
      const now = new Date();
      
      // Find all events that are still 'Open' and whose registration deadline has passed.
      const result = await Event.updateMany(
        { registrationDeadline: { $lt: now }, status: 'Open' },
        { $set: { status: 'Closed' } }
      );

      if (result.modifiedCount > 0) {
        console.log(`✅ Updated ${result.modifiedCount} event(s) to "Closed".`);
      }
    } catch (error) {
      console.error('❌ Error updating event statuses:', error);
    }
  });
};

module.exports = startEventStatusUpdater;
