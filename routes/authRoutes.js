const express = require('express');
const router = express.Router();

const {
  signupUser,
  verifyEmail,
  loginUser,
  forgotPassword,
  showResetPasswordForm, // Import new function
  resetPassword,
} = require('../controllers/authController');

router.post('/signup', signupUser);
router.get('/verify-email/:token', verifyEmail);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);

// --- UPDATED PASSWORD RESET ROUTES ---

// When a user clicks the link in the email, it's a GET request
router.get('/reset-password/:token', showResetPasswordForm);

// When the user submits the form on the new page, it's a POST request
router.post('/reset-password/:token', resetPassword);

module.exports = router;
