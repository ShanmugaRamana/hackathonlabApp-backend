const dotenv = require('dotenv');
const path = require('path');
const sendEmail = require('../utils/sendEmail');

// Load environment variables from the .env file at the root of your project
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const testSendEmail = async () => {
  console.log('--- Running Email Send Test ---');

  // Check if necessary environment variables are loaded
  if (!process.env.EMAIL_USERNAME || !process.env.EMAIL_PASSWORD) {
    console.error('❌ ERROR: EMAIL_USERNAME or EMAIL_PASSWORD not found in .env file.');
    console.log('Please ensure your .env file is correctly set up in the project root.');
    return;
  }

  console.log(`✉️  Attempting to send email from: ${process.env.EMAIL_USERNAME}`);

  const testOptions = {
    // IMPORTANT: Change this to a real email address you can check
    email: 'shanmugaramana.cb23@bitsathy.ac.in',
    subject: 'SMTP Connection Test',
    message: `
      <div style="font-family: Arial, sans-serif; font-size: 16px;">
        <h1>Hello!</h1>
        <p>If you are receiving this email, it means the SMTP connection from your application is working correctly.</p>
        <p>This is an automated test message.</p>
        <p><strong>Timestamp:</strong> ${new Date().toUTCString()}</p>
      </div>
    `,
  };

  try {
    console.log('🚀 Sending email...');
    await sendEmail(testOptions);
    console.log('✅ SUCCESS: Email sent successfully!');
    console.log('Please check the inbox of', testOptions.email);
  } catch (error) {
    console.error('❌ FAILED: Could not send email. See error below:');
    console.error('--------------------------------------------------');
    console.error('Error Code:', error.code);
    console.error('Error Command:', error.command);
    console.error('Full Error:', error);
    console.error('--------------------------------------------------');
    console.log('\nTroubleshooting Tips:');
    console.log('1. Double-check your EMAIL_USERNAME and EMAIL_PASSWORD in the .env file.');
    console.log('2. If using Gmail with 2FA, ensure you are using a 16-character App Password, not your regular password.');
    console.log('3. Check if your hosting provider (e.g., Render) has any firewall restrictions on outgoing SMTP ports (465, 587).');
  }
};

// Run the test
testSendEmail();
