const express = require('express');
const router = express.Router();
const {
  signup,
  doctorSignup,
  verifyOtp,
  resendOtp,
  login,
  googleAuth,
} = require('../controllers/authController');

router.post('/signup', signup);
router.post('/doctor-signup', doctorSignup);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.post('/login', login);
router.post('/google', googleAuth);

module.exports = router;
