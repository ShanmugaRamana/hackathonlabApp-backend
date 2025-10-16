const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
    // --- NEW: Add connection timeouts for faster failures ---
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000, // 10 seconds
    socketTimeout: 10000, // 10 seconds
  });

  // --- NEW: Verify the connection configuration ---
  // This is a great debugging step.
  try {
    await transporter.verify();
    console.log('✅ SMTP Server connection is ready.');
  } catch (error) {
    console.error('❌ SMTP Server connection failed. Check credentials and firewall settings.', error);
    // Re-throw the error to be caught by the calling function
    throw new Error('Failed to connect to email server. Please check server configuration.');
  }

  const mailOptions = {
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    html: options.message,
  };

  // --- NEW: Add try...catch around the sendMail call ---
  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    // Re-throw the error so the calling function (e.g., in authController) can handle it
    throw error;
  }
};

module.exports = sendEmail;

