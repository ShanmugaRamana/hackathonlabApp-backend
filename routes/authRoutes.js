const express = require('express');
const router = express.Router();

const {
  signupUser,
  verifyEmail,
  loginUser,
  forgotPassword,
  showResetPasswordForm,
  resetPassword,
  changePassword,
  deleteAccount,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.post('/signup', signupUser);
router.get('/verify-email/:token', verifyEmail);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.get('/reset-password/:token', showResetPasswordForm);
router.post('/reset-password/:token', resetPassword);

// Protected route for logged-in users
router.put('/change-password', protect, changePassword);
router.post('/delete-account', protect, deleteAccount);

module.exports = router;