const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // 1. Create a transporter object using a more explicit SMTP configuration
  // This is more reliable than just using the 'service' property, especially on servers.
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com', // Explicitly define the host
    port: process.env.EMAIL_PORT || 465,              // Use port 465 for SSL, the most common secure port
    secure: true,                                     // `true` for port 465, `false` for other ports like 587
    auth: {
      user: process.env.EMAIL_USERNAME, // Your email address
      pass: process.env.EMAIL_PASSWORD, // Your email password or app-specific password
    },
  });

  // 2. Define the email options (this part remains the same)
  const mailOptions = {
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    html: options.message,
  };

  // 3. Actually send the email (this part remains the same)
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;