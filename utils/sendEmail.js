// --- NEW: Import SDKs for all email services ---
const { Resend } = require('resend');
const Brevo = require('@getbrevo/brevo');

// --- Helper function for Brevo ---
const sendWithBrevo = async (options) => {
  const brevo = new Brevo.TransactionalEmailsApi();
  brevo.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);
  await brevo.sendTransacEmail({
    subject: options.subject,
    sender: { email: process.env.FROM_EMAIL, name: process.env.FROM_NAME },
    to: [{ email: options.email }],
    htmlContent: options.message,
  });
};

// --- Helper function for Resend ---
const sendWithResend = async (options) => {
  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: `${process.env.FROM_NAME} <${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}>`,
    to: [options.email],
    subject: options.subject,
    html: options.message,
  });
};

// --- Main sendEmail function with fallback logic ---
const sendEmail = async (options) => {
  // List of services to try in order.
  const services = [
    { name: 'Brevo',   sender: sendWithBrevo,   apiKey: process.env.BREVO_API_KEY },
    { name: 'Resend',  sender: sendWithResend,  apiKey: process.env.RESEND_API_KEY },
  ];

  for (const service of services) {
    // Only attempt to use a service if its API key is provided
    if (service.apiKey) {
      try {
        console.log(`🚀 Attempting to send email via ${service.name}...`);
        await service.sender(options);
        console.log(`✅ Email sent successfully via ${service.name}!`);
        return; // Success! Exit the function.
      } catch (error) {
        console.error(`❌ Failed to send email via ${service.name}. Trying next service...`);
        // Log the specific error for debugging
        console.error(`Error details for ${service.name}:`, error.message);
      }
    } else {
       console.log(`- Skipping ${service.name} (API key not found).`);
    }
  }

  // If the loop finishes without returning, all services have failed.
  console.error('❌ All configured email services failed. The email could not be sent.');
  throw new Error('All email services failed.');
};

module.exports = sendEmail;