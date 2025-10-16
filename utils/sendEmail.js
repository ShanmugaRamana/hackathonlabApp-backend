const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  try {
    // Validate required options
    if (!options.email) {
      throw new Error('Recipient email address is required');
    }
    if (!options.subject) {
      throw new Error('Email subject is required');
    }
    if (!options.message) {
      throw new Error('Email message is required');
    }

    // Validate environment variables
    if (!process.env.EMAIL_USERNAME || !process.env.EMAIL_PASSWORD) {
      throw new Error('Email credentials are not configured. Check EMAIL_USERNAME and EMAIL_PASSWORD environment variables');
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });

    // Verify SMTP connection
    console.log('🔄 Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully');

    const mailOptions = {
      from: `${process.env.FROM_NAME || 'HackathonLab'} <${process.env.EMAIL_USERNAME}>`,
      to: options.email,
      subject: options.subject,
      html: options.message,
    };

    // Send email
    console.log(`📧 Sending email to ${options.email}...`);
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email sent successfully');
    console.log(`Message ID: ${info.messageId}`);
    console.log(`Response: ${info.response}`);

    return {
      success: true,
      messageId: info.messageId,
      response: info.response,
    };

  } catch (error) {
    console.error('❌ Email sending failed:', error.message);

    // Detailed error logging
    if (error.code === 'ETIMEDOUT') {
      console.error('Connection timeout - SMTP ports may be blocked by hosting provider');
      console.error('Consider using SendGrid, Mailgun, or another email service API');
    } else if (error.code === 'EAUTH') {
      console.error('Authentication failed - Check your EMAIL_USERNAME and EMAIL_PASSWORD');
      console.error('For Gmail, ensure you are using an App Password, not your regular password');
    } else if (error.code === 'ECONNECTION') {
      console.error('Connection failed - Check your internet connection and SMTP settings');
    } else if (error.responseCode === 550) {
      console.error('Recipient rejected - Email address may not exist or is invalid');
    }

    // Re-throw with more context
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

module.exports = sendEmail;