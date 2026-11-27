const express = require('express');
const router = express.Router();
const { loginAdmin, getMe, forgotPassword, verifyOtp, resetPassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { authLimiter, otpLimiter } = require('../middleware/rateLimitMiddleware');

router.post('/login', authLimiter, loginAdmin);
router.get('/me', protect, getMe);
router.post('/forgot-password', otpLimiter, forgotPassword);
router.post('/verify-otp', otpLimiter, verifyOtp);
router.post('/reset-password', authLimiter, resetPassword);

module.exports = router;
