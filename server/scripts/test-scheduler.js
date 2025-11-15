/**
 * Test script for the notification scheduler
 * Runs all notifications once to verify everything works
 * 
 * Usage:
 *   node server/scripts/test-scheduler.js
 */

require('dotenv').config();
const { sequelize } = require('../models');
const { runAllNotifications } = require('./notification-scheduler');

async function test() {
  console.log('🧪 Testing Notification Scheduler');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
  
  try {
    await runAllNotifications();
    console.log('');
    console.log('✅ Test completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    // Close database connection
    try {
      await sequelize.close();
      console.log('✅ Database connection closed');
    } catch (err) {
      console.error('⚠️  Error closing database:', err.message);
    }
  }
}

// Run test
test();
