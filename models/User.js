// Import necessary packages
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto'); // Import crypto for token generation

// Define the schema for the User model
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    match: [
      /^[a-zA-Z0-9._%+-]+@bitsathy\.ac\.in$/,
      'Please provide a valid @bitsathy.ac.in email address',
    ],
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false,
  },
  role: {
    type: String,
    enum: ['Member', 'Admin'], // Defines possible roles
    default: 'Member',       // Sets the default role for all new users
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  emailVerificationToken: String,
  // --- NEW FIELDS FOR PASSWORD RESET ---
  passwordResetToken: String,
  passwordResetExpires: Date,
});

// Middleware: Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare entered password with the hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// --- NEW METHOD: Generate and hash password reset token ---
userSchema.methods.getResetPasswordToken = function () {
  // Generate token
  const resetToken = crypto.randomBytes(32).toString('hex');

  // Hash token and set to passwordResetToken field
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire time (e.g., 10 minutes)
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  // Return the unhashed token (to be sent via email)
  return resetToken;
};


// Create the User model from the schema
const User = mongoose.model('User', userSchema);

// Export the model
module.exports = User;

