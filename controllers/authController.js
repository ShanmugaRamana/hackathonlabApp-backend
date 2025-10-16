const crypto = require('crypto');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const jwt = require('jsonwebtoken');
const Chat = require('../models/Chat');
const RoleRequest = require('../models/RoleRequest');
// --- Helper function to generate a JWT ---
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register/Signup a new user and send verification email
const signupUser = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const user = await User.create({
      name,
      email,
      password,
      emailVerificationToken: crypto.createHash('sha256').update(verificationToken).digest('hex'),
    });
    if (user) {
      const verificationUrl = `${process.env.BACKEND_URL}/api/auth/verify-email/${verificationToken}`;
      const message = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f7fa;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f7fa; padding: 40px 20px;">
          <tr>
            <td align="center">
              <!-- Main Container -->
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); overflow: hidden;">
                
                <!-- Header Section with Banner GIF -->
                <tr>
                  <td style="padding: 0; text-align: center; background-color: #000000;">
                    <img src="https://i.pinimg.com/originals/a4/c1/32/a4c132ada8c1797c0cbd93d8609a9ac4.gif" alt="Welcome to HackathonLab" style="width: 100%; max-width: 600px; height: auto; display: block; border: 0;">
                  </td>
                </tr>
                
                <!-- Content Section -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="margin: 0 0 20px 0; color: #1a202c; font-size: 22px; font-weight: 600;">
                      Verify Your Email Address
                    </h2>
                    
                    <p style="margin: 0 0 20px 0; color: #4a5568; font-size: 16px; line-height: 1.6;">
                      Thank you for registering! We're excited to have you on board. To complete your registration and start exploring, please verify your email address by clicking the button below.
                    </p>
                    
                    <!-- CTA Button -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                      <tr>
                        <td align="center">
                          <a href="${verificationUrl}" clicktracking="off" style="display: inline-block; background-color: #000000; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);">
                            Verify Email Address
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="margin: 30px 0 10px 0; color: #718096; font-size: 14px; line-height: 1.6;">
                      If the button doesn't work, copy and paste this link into your browser:
                    </p>
                    
                    <div style="background-color: #f7fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 15px; word-break: break-all;">
                      <a href="${verificationUrl}" clicktracking="off" style="color: #667eea; text-decoration: underline; font-size: 14px;">
                        ${verificationUrl}
                      </a>
                    </div>
                  </td>
                </tr>
                
                <!-- Divider -->
                <tr>
                  <td style="padding: 0 30px;">
                    <div style="border-top: 1px solid #e2e8f0;"></div>
                  </td>
                </tr>
                
                <!-- Footer Section -->
                <tr>
                  <td style="padding: 30px; text-align: center; background-color: #f7fafc;">
                    <p style="margin: 0 0 10px 0; color: #a0aec0; font-size: 13px;">
                      If you didn't create an account with HackathonLab, you can safely ignore this email.
                    </p>
                    <p style="margin: 0; color: #a0aec0; font-size: 13px;">
                      © ${new Date().getFullYear()} HackathonLab. All rights reserved.
                    </p>
                  </td>
                </tr>
                
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
      `;
      try {
        await sendEmail({
          email: user.email,
          subject: 'Hackathon Lab - Email Verification',
          message,
        });
        res.status(201).json({
          success: true,
          message: 'Signup successful! Please check your email to verify your account.',
        });
      } catch (err) {
        console.error(err);
        user.emailVerificationToken = undefined;
        await user.save({ validateBeforeSave: false });
        return res.status(500).json({ message: 'Email could not be sent' });
      }
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify user's email 
const verifyEmail = async (req, res) => {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    try {
        const user = await User.findOne({ emailVerificationToken: hashedToken });
        if (!user) {
            return res.status(400).send('<h1>Invalid or expired verification link.</h1>');
        }
        user.isVerified = true;
        user.emailVerificationToken = undefined;
        await user.save();
        res.status(200).send('<h1>Email Verified Successfully!</h1><p>You can now close this tab and log in to the app.</p>');
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Authenticate/Login user & get token
const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    if (!user.isVerified) {
      return res.status(403).json({ message: 'Please verify your email before logging in.' });
    }
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Forgot password
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json({ success: true, message: 'If a user with that email exists, a password reset link has been sent.' });
    }
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.BACKEND_URL}/api/auth/reset-password/${resetToken}`;
    const message = `
      <h1>Password Reset Request</h1>
      <p>Please click the link below to reset your password:</p>
      <a href="${resetUrl}" clicktracking=off>${resetUrl}</a>
    `;
    await sendEmail({
      email: user.email,
      subject: 'Hackathon Lab - Password Reset',
      message,
    });
    res.status(200).json({ success: true, message: 'If a user with that email exists, a password reset link has been sent.' });
  } catch (err) {
    console.error(err);
    const user = await User.findOne({ email });
    if (user) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });
    }
    return res.status(500).json({ message: 'Email could not be sent' });
  }
};

// @desc    Show reset password form
const showResetPasswordForm = (req, res) => {
    const token = req.params.token;
    res.setHeader('Content-Type', 'text/html');
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Password</title>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f0f2f5; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
                .card { background-color: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); text-align: center; width: 90%; max-width: 400px; }
                h1 { color: #1c1e21; margin-bottom: 24px; }
                input { width: 100%; padding: 12px; margin-bottom: 15px; border-radius: 6px; border: 1px solid #dddfe2; box-sizing: border-box; font-size: 16px; }
                button { width: 100%; padding: 12px; border: none; border-radius: 6px; background-color: #1877f2; color: white; font-size: 16px; font-weight: bold; cursor: pointer; transition: background-color 0.2s; }
                button:hover { background-color: #166fe5; }
                button:disabled { background-color: #9cb4d8; cursor: not-allowed; }
                .message { margin-top: 20px; font-size: 14px; font-weight: 500; }
            </style>
        </head>
        <body>
            <div class="card">
                <h1>Set a New Password</h1>
                <form id="resetForm">
                    <input type="password" id="password" name="password" placeholder="Enter new password" required>
                    <input type="password" id="confirmPassword" name="confirmPassword" placeholder="Confirm new password" required>
                    <button type="submit">Reset Password</button>
                </form>
                <p id="message" class="message"></p>
            </div>
            <script>
                document.getElementById('resetForm').addEventListener('submit', async function(e) {
                    e.preventDefault();
                    const pathParts = window.location.pathname.split('/');
                    const token = pathParts[pathParts.length - 1];
                    const password = document.getElementById('password').value;
                    const confirmPassword = document.getElementById('confirmPassword').value;
                    const messageEl = document.getElementById('message');
                    const buttonEl = document.querySelector('button');
                    if (password !== confirmPassword) {
                        messageEl.textContent = 'Passwords do not match!';
                        messageEl.style.color = 'red';
                        return;
                    }
                    buttonEl.disabled = true;
                    messageEl.textContent = 'Resetting...';
                    messageEl.style.color = 'black';
                    try {
                        const response = await fetch('/api/auth/reset-password/' + token, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ password })
                        });
                        const data = await response.json();
                        if (response.ok) {
                            messageEl.textContent = 'Password has been reset successfully! You can close this window.';
                            messageEl.style.color = 'green';
                            document.querySelector('form').style.display = 'none';
                        } else {
                            messageEl.textContent = data.message || 'Failed to reset password.';
                            messageEl.style.color = 'red';
                            buttonEl.disabled = false;
                        }
                    } catch (error) {
                        messageEl.textContent = 'An error occurred. Please try again.';
                        messageEl.style.color = 'red';
                        buttonEl.disabled = false;
                    }
                });
            </script>
        </body>
        </html>
    `);
};

// @desc    Reset password
const resetPassword = async (req, res) => {
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  try {
    const user = await User.findOne({
      passwordResetToken: resetPasswordToken,
      passwordResetExpires: { $gt: Date.now() },
    });
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }
    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    res.status(200).json({ success: true, message: 'Password reset successful!' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Change user password while logged in
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user._id;

  try {
    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect current password' });
    }

    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
const deleteAccount = async (req, res) => {
  const { password } = req.body;
  const userId = req.user._id;

  try {
    const user = await User.findById(userId).select('+password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify the password to confirm deletion
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect password' });
    }

    // --- ANONYMIZE AND DELETE USER DATA ---
    
    // 1. Anonymize the user's chat messages instead of deleting them
    await Chat.updateMany(
      { 'user._id': userId },
      { $set: { 'user.name': 'Deleted User' } }
    );

    // 2. Delete user's role requests
    await RoleRequest.deleteMany({ user: userId });
    
    // 3. Delete the user account itself
    await User.findByIdAndDelete(userId);

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
const resendVerificationEmail = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    // Only proceed if the user exists and is not yet verified
    if (user && !user.isVerified) {
      // Create a new verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      user.emailVerificationToken = crypto
        .createHash('sha256')
        .update(verificationToken)
        .digest('hex');
      
      await user.save();

      // Send the new verification email
      const verificationUrl = `${process.env.BACKEND_URL}/api/auth/verify-email/${verificationToken}`;
      const message = `
        <h1>Account Verification</h1>
        <p>Please click the link below to verify your email address:</p>
        <a href="${verificationUrl}" clicktracking=off>${verificationUrl}</a>
      `;
      
      await sendEmail({
        email: user.email,
        subject: 'Hackathon Lab - New Email Verification',
        message,
      });
    }
    
    // Always send a success response to prevent email enumeration
    res.json({ message: 'If an account with that email exists, a new verification link has been sent.' });

  } catch (error) {
    console.error('Error resending verification email:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
module.exports = {
  signupUser,
  verifyEmail,
  loginUser,
  forgotPassword,
  showResetPasswordForm,
  resetPassword,
  deleteAccount,
  changePassword,
  resendVerificationEmail,
};
