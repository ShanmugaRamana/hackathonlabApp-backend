const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // This is the validated transporter configuration that the test script successfully used.
  // It's more reliable for servers than using the simple 'service' option.
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com', // Explicitly define the host
    port: process.env.EMAIL_PORT || 465,              // Use port 465 for SSL (secure connection)
    secure: true,                                     // Must be true for port 465
    auth: {
      user: process.env.EMAIL_USERNAME, // Your full email address
      pass: process.env.EMAIL_PASSWORD, // Your 16-character App Password
    },
  });

  // Define the email options
  const mailOptions = {
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    html: options.message,
  };

  // Send the email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;