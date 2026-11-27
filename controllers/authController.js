const crypto = require('crypto');
const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const transporter = require('../config/nodemailer');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Auth admin & get token
// @route   POST /api/auth/login
// @access  Public
const loginAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Please provide email and password');
  }

  const user = await User.findOne({ email: String(email).toLowerCase().trim() });

  if (user && (await user.matchPassword(password))) {
    res.json({
      success: true,
      data: {
        _id: user._id,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      },
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

// @desc    Get current authenticated admin
// @route   GET /api/auth/me
// @access  Protected
const getMe = asyncHandler(async (req, res) => {
  if (!req.user) {
    res.status(401);
    throw new Error('Not authorized');
  }
  res.json({
    success: true,
    data: {
      _id: req.user._id,
      email: req.user.email,
      role: req.user.role,
    },
  });
});

// @desc    Send OTP to email
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    res.status(400);
    throw new Error('Please provide an email address');
  }

  const user = await User.findOne({ email: String(email).toLowerCase().trim() });
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const otp = crypto.randomInt(100000, 1000000).toString();
  const salt = await bcrypt.genSalt(10);
  const hashedOtp = await bcrypt.hash(otp, salt);

  user.resetOtp = hashedOtp;
  user.resetOtpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes
  user.resetTokenHash = undefined;
  user.resetTokenExpiry = undefined;
  await user.save();

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Password Reset OTP - AK Constructions',
      html: `
        <h2>Password Reset Request</h2>
        <p>Your One Time Password (OTP) for resetting your password is: <strong>${otp}</strong></p>
        <p>This OTP will expire in 10 minutes.</p>
      `,
    });
    res.json({ success: true, message: 'OTP sent successfully' });
  } catch (err) {
    user.resetOtp = undefined;
    user.resetOtpExpiry = undefined;
    await user.save();
    console.error(err);
    res.status(500);
    throw new Error('Email could not be sent');
  }
});

// @desc    Verify OTP and issue one-time reset token
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    res.status(400);
    throw new Error('Please provide email and OTP');
  }

  const user = await User.findOne({ email: String(email).toLowerCase().trim() });
  if (!user || !user.resetOtp || !user.resetOtpExpiry) {
    res.status(400);
    throw new Error('Invalid request or OTP not generated');
  }

  if (Date.now() > user.resetOtpExpiry) {
    res.status(400);
    throw new Error('OTP has expired');
  }

  const isMatch = await bcrypt.compare(otp.toString(), user.resetOtp);
  if (!isMatch) {
    res.status(400);
    throw new Error('Invalid OTP');
  }

  const rawResetToken = crypto.randomBytes(32).toString('hex');
  user.resetTokenHash = crypto.createHash('sha256').update(rawResetToken).digest('hex');
  user.resetTokenExpiry = new Date(Date.now() + 10 * 60 * 1000);
  user.resetOtp = undefined;
  user.resetOtpExpiry = undefined;
  await user.save();

  res.json({
    success: true,
    message: 'OTP verified successfully',
    resetToken: rawResetToken,
  });
});

// @desc    Reset Password (requires verified resetToken)
// @route   POST /api/auth/reset-password
// @access  Public (token-gated)
const resetPassword = asyncHandler(async (req, res) => {
  const { email, resetToken, newPassword } = req.body;

  if (!email || !resetToken || !newPassword || newPassword.length < 6) {
    res.status(400);
    throw new Error('Email, verified reset token, and password (min 6 chars) are required');
  }

  const user = await User.findOne({ email: String(email).toLowerCase().trim() });
  if (!user || !user.resetTokenHash || !user.resetTokenExpiry) {
    res.status(403);
    throw new Error('Password reset not authorized. Please verify OTP first.');
  }

  if (Date.now() > new Date(user.resetTokenExpiry).getTime()) {
    res.status(400);
    throw new Error('Reset session expired. Please request a new OTP.');
  }

  const providedHash = crypto.createHash('sha256').update(String(resetToken)).digest('hex');
  const expectedBuf = Buffer.from(user.resetTokenHash, 'hex');
  const providedBuf = Buffer.from(providedHash, 'hex');

  if (expectedBuf.length !== providedBuf.length || !crypto.timingSafeEqual(expectedBuf, providedBuf)) {
    res.status(403);
    throw new Error('Invalid reset token');
  }

  user.password = newPassword;
  user.resetOtp = undefined;
  user.resetOtpExpiry = undefined;
  user.resetTokenHash = undefined;
  user.resetTokenExpiry = undefined;
  await user.save();

  res.json({ success: true, message: 'Password reset successful. You can now login.' });
});

module.exports = { loginAdmin, getMe, forgotPassword, verifyOtp, resetPassword };
