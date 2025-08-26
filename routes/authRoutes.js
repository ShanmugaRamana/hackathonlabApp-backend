const express = require('express');
const router = express.Router();
const passport = require("passport");

const {
  signupUser,
  verifyEmail,
  loginUser,
  forgotPassword,
  showResetPasswordForm,
  resetPassword,
  changePassword,
  deleteAccount,
  resendVerificationEmail,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
// Public routes
router.post('/signup', signupUser);
router.get('/verify-email/:token', verifyEmail);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.get('/reset-password/:token', showResetPasswordForm);
router.post('/reset-password/:token', resetPassword);
router.post('/resend-verification', resendVerificationEmail);

// Protected route for logged-in users
router.put('/change-password', protect, changePassword);
router.post('/delete-account', protect, deleteAccount);

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    // Send JWT token after successful login
    const token = req.user.token;
    res.json({
      success: true,
      token,
      user: {
        _id: req.user.user._id,
        name: req.user.user.name,
        email: req.user.user.email,
      },
    });
  }
);
module.exports = router;