// --- We use Nodemailer for direct SMTP connections ---
const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Check that all required environment variables are present
  if (
    !process.env.BREVO_SMTP_HOST ||
    !process.env.BREVO_SMTP_PORT ||
    !process.env.BREVO_SMTP_USER ||
    !process.env.BREVO_SMTP_PASS
  ) {
    console.error('❌ Brevo SMTP environment variables are not fully configured.');
    throw new Error('Email service is not configured.');
  }

  // 1. Create a transporter object using Brevo's SMTP details
  const transporter = nodemailer.createTransport({
    host: process.env.BREVO_SMTP_HOST,
    port: parseInt(process.env.BREVO_SMTP_PORT, 10), // Ensure port is an integer
    secure: process.env.BREVO_SMTP_PORT === '465', // `secure` is true for port 465, false for 587
    auth: {
      user: process.env.BREVO_SMTP_USER,
      pass: process.env.BREVO_SMTP_PASS, // This is your Brevo SMTP Key
    },
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000, // 10 seconds
  });

  // 2. Define the email options
  const mailOptions = {
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    html: options.message,
  };

  // 3. Send the email and handle potential errors
  try {
    console.log('🚀 Attempting to send email via Brevo SMTP...');
    await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully via Brevo SMTP!');
  } catch (error) {
    console.error('❌ Failed to send email via Brevo SMTP.');
    console.error('Error details:', error.message);
    throw new Error('Failed to send email.');
  }
};

module.exports = sendEmail;

