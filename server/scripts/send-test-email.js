/**
 * Script to send a test email via AWS SES
 * Usage: node server/scripts/send-test-email.js <email-address>
 */

require('dotenv').config();
const EmailService = require('../services/EmailService');

async function sendTestEmail() {
  const emailAddress = process.argv[2] || 'selvakumar@selsoftinc.com';
  
  console.log('📧 Sending test email...');
  console.log('To:', emailAddress);
  console.log('From: noreply@timepulse.io');
  console.log('');
  
  try {
    const result = await EmailService.sendTestEmail(emailAddress);
    
    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', result.messageId);
    console.log('');
    console.log('Please check the inbox (and spam folder) for:', emailAddress);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to send test email:');
    console.error('');
    console.error('Error:', error.message);
    
    if (error.response) {
      console.error('Response:', error.response);
    }
    
    if (error.code === 'EAUTH') {
      console.error('');
      console.error('⚠️  Authentication failed. Check:');
      console.error('  - SMTP_USER and SMTP_PASS are set correctly');
      console.error('  - Credentials are valid');
      console.error('  - For AWS SES: Domain is verified');
    }
    
    if (error.code === 'ECONNECTION') {
      console.error('');
      console.error('⚠️  Connection failed. Check:');
      console.error('  - SMTP_HOST is correct (email-smtp.us-east-1.amazonaws.com)');
      console.error('  - SMTP_PORT is correct (587)');
      console.error('  - Network connectivity');
    }
    
    process.exit(1);
  }
}

// Run the script
sendTestEmail();

