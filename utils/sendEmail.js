// --- Use Brevo's API instead of SMTP (more reliable on cloud platforms) ---
const axios = require('axios');

const sendEmail = async (options) => {
  // Check that the API key is present
  if (!process.env.BREVO_API_KEY) {
    console.error('❌ Brevo API key is not configured.');
    console.error('💡 HINT: Please set BREVO_API_KEY in your environment variables.');
    throw new Error('Email service is not configured.');
  }

  // Validate required sender information
  if (!process.env.FROM_EMAIL) {
    console.error('❌ FROM_EMAIL environment variable is not configured.');
    throw new Error('Email service is not configured.');
  }

  // Validate required options
  if (!options.email) {
    console.error('❌ Recipient email is required.');
    throw new Error('Recipient email is required.');
  }

  if (!options.subject) {
    console.error('❌ Email subject is required.');
    throw new Error('Email subject is required.');
  }

  if (!options.message) {
    console.error('❌ Email message is required.');
    throw new Error('Email message is required.');
  }

  // Build recipient object - only include name if it's provided and not empty
  const recipient = {
    email: options.email,
  };
  
  // Only add name field if it exists and is not empty
  if (options.name && options.name.trim() !== '') {
    recipient.name = options.name;
  }

  // Define the email payload for Brevo API
  const emailPayload = {
    sender: {
      name: process.env.FROM_NAME || 'HackathonLab',
      email: process.env.FROM_EMAIL,
    },
    to: [recipient],
    subject: options.subject,
    htmlContent: options.message,
  };

  // Optional: Add CC recipients if provided
  if (options.cc) {
    const ccList = Array.isArray(options.cc) ? options.cc : [options.cc];
    emailPayload.cc = ccList.map(email => {
      if (typeof email === 'string') {
        return { email };
      }
      return email;
    });
  }

  // Optional: Add BCC recipients if provided
  if (options.bcc) {
    const bccList = Array.isArray(options.bcc) ? options.bcc : [options.bcc];
    emailPayload.bcc = bccList.map(email => {
      if (typeof email === 'string') {
        return { email };
      }
      return email;
    });
  }

  // Optional: Add reply-to if provided
  if (options.replyTo) {
    emailPayload.replyTo = {
      email: options.replyTo,
    };
  }

  try {
    console.log('🚀 Attempting to send email via Brevo API...');
    console.log(`📧 To: ${options.email}`);
    console.log(`📝 Subject: ${options.subject}`);
    
    const response = await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      emailPayload,
      {
        headers: {
          'api-key': process.env.BREVO_API_KEY,
          'Content-Type': 'application/json',
          'accept': 'application/json',
        },
        timeout: 15000, // 15 second timeout
      }
    );

    console.log('✅ Email sent successfully via Brevo API!');
    console.log(`📬 Message ID: ${response.data.messageId}`);
    
    return {
      success: true,
      messageId: response.data.messageId,
    };
  } catch (error) {
    console.error('❌ Failed to send email via Brevo API.');
    
    if (error.response) {
      // Brevo API returned an error response
      const status = error.response.status;
      const errorData = error.response.data;
      
      console.error(`🔴 API Error Status: ${status}`);
      console.error('🔴 API Error Details:', JSON.stringify(errorData, null, 2));
      
      // Provide specific hints based on error status
      if (status === 401) {
        console.error('💡 HINT: Authentication failed. Please check your BREVO_API_KEY.');
      } else if (status === 400) {
        console.error('💡 HINT: Bad request. Check the error message above for details.');
        if (errorData.code === 'missing_parameter') {
          console.error(`💡 Missing parameter: ${errorData.message}`);
        } else if (errorData.message && errorData.message.includes('sender')) {
          console.error('💡 FROM_EMAIL must be verified in your Brevo account.');
        }
      } else if (status === 402) {
        console.error('💡 HINT: Account limitation. You may have reached your sending limit or need to upgrade your Brevo plan.');
      } else if (status === 403) {
        console.error('💡 HINT: Forbidden. Your API key may not have permission to send emails.');
      } else if (status === 404) {
        console.error('💡 HINT: Endpoint not found. Please verify the Brevo API URL.');
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error('🔴 No response received from Brevo API.');
      console.error('🔴 Request Error:', error.message);
      console.error('💡 HINT: This could be a network issue or Brevo API might be temporarily unavailable.');
    } else {
      // Something else went wrong during request setup
      console.error('🔴 Error setting up request:', error.message);
    }
    
    // Include error code if available
    if (error.code) {
      console.error(`🔴 Error Code: ${error.code}`);
    }
    
    throw new Error('Failed to send email.');
  }
};

module.exports = sendEmail;