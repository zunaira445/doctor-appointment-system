const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const pool = require('../config/db');
const { sendOtpEmail } = require('../utils/mailer');
const { generateOtp, formatMysqlDatetime } = require('../utils/otp');
require('dotenv').config();

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

// ------------------------------------------------------------------
// POST /api/auth/signup  (patient) — creates an unverified account and
// emails a 6-digit OTP. Account only becomes usable after /verify-otp.
// ------------------------------------------------------------------
async function signup(req, res) {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    const [existing] = await pool.query('SELECT id, is_verified FROM users WHERE email = ?', [email]);
    if (existing.length > 0 && existing[0].is_verified) {
      return res.status(400).json({ message: 'Email already registered. Please log in.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const { otp, expiresAt } = generateOtp();

    if (existing.length > 0) {
      // Unverified row exists (previous incomplete signup) — update it and resend OTP.
      await pool.query(
        `UPDATE users SET name=?, password=?, phone=?, otp_code=?, otp_expires_at=? WHERE id=?`,
        [name, hashedPassword, phone || null, otp, formatMysqlDatetime(expiresAt), existing[0].id]
      );
    } else {
      await pool.query(
        `INSERT INTO users (name, email, password, phone, role, provider, is_verified, otp_code, otp_expires_at)
         VALUES (?, ?, ?, ?, 'patient', 'local', 0, ?, ?)`,
        [name, email, hashedPassword, phone || null, otp, formatMysqlDatetime(expiresAt)]
      );
    }

    await sendOtpEmail({ to: email, name, otp });

    res.status(201).json({
      message: 'Signup started. Please check your email for a verification code.',
      email,
      requiresOtp: true,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during signup.' });
  }
}

// ------------------------------------------------------------------
// POST /api/auth/doctor-signup — doctors register themselves.
// Creates a 'doctor' user + matching row in `doctors`, both pending
// until the OTP is verified.
// ------------------------------------------------------------------
async function doctorSignup(req, res) {
  try {
    const {
      name, email, password, phone,
      specialization, experience, fee, image, bio, available_days, available_time,
    } = req.body;

    if (!name || !email || !password || !specialization) {
      return res.status(400).json({ message: 'Name, email, password, and specialization are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    const [existing] = await pool.query('SELECT id, is_verified FROM users WHERE email = ?', [email]);
    if (existing.length > 0 && existing[0].is_verified) {
      return res.status(400).json({ message: 'Email already registered. Please log in.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const { otp, expiresAt } = generateOtp();

    let userId;
    if (existing.length > 0) {
      userId = existing[0].id;
      await pool.query(
        `UPDATE users SET name=?, password=?, phone=?, role='doctor', otp_code=?, otp_expires_at=? WHERE id=?`,
        [name, hashedPassword, phone || null, otp, formatMysqlDatetime(expiresAt), userId]
      );
      // Remove any stale unverified doctor profile from a previous attempt.
      await pool.query('DELETE FROM doctors WHERE user_id = ?', [userId]);
    } else {
      const [result] = await pool.query(
        `INSERT INTO users (name, email, password, phone, role, provider, is_verified, otp_code, otp_expires_at)
         VALUES (?, ?, ?, ?, 'doctor', 'local', 0, ?, ?)`,
        [name, email, hashedPassword, phone || null, otp, formatMysqlDatetime(expiresAt)]
      );
      userId = result.insertId;
    }

    await pool.query(
      `INSERT INTO doctors (user_id, name, email, specialization, experience, fee, image, bio, available_days, available_time, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        userId, name, email, specialization,
        experience || 0, fee || 0, image || '', bio || '',
        available_days || 'Mon-Sat', available_time || '9:00 AM - 5:00 PM',
      ]
    );

    await sendOtpEmail({ to: email, name, otp });

    res.status(201).json({
      message: 'Signup started. Please check your email for a verification code.',
      email,
      requiresOtp: true,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during doctor signup.' });
  }
}

// ------------------------------------------------------------------
// POST /api/auth/verify-otp — completes signup for both patients and doctors.
// ------------------------------------------------------------------
async function verifyOtp(req, res) {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and code are required.' });
    }

    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(400).json({ message: 'Account not found.' });
    }

    const user = rows[0];
    if (user.is_verified) {
      return res.status(400).json({ message: 'Account already verified. Please log in.' });
    }
    if (!user.otp_code || !user.otp_expires_at) {
      return res.status(400).json({ message: 'No pending verification. Please sign up again.' });
    }
    if (new Date(user.otp_expires_at) < new Date()) {
      return res.status(400).json({ message: 'Code expired. Please request a new one.' });
    }
    if (user.otp_code !== String(otp).trim()) {
      return res.status(400).json({ message: 'Incorrect code. Please try again.' });
    }

    await pool.query(
      'UPDATE users SET is_verified = 1, otp_code = NULL, otp_expires_at = NULL WHERE id = ?',
      [user.id]
    );

    const token = signToken(user);
    res.json({ message: 'Email verified successfully.', token, user: publicUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during verification.' });
  }
}

// ------------------------------------------------------------------
// POST /api/auth/resend-otp
// ------------------------------------------------------------------
async function resendOtp(req, res) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required.' });

    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) return res.status(400).json({ message: 'Account not found.' });

    const user = rows[0];
    if (user.is_verified) {
      return res.status(400).json({ message: 'Account already verified. Please log in.' });
    }

    const { otp, expiresAt } = generateOtp();
    await pool.query('UPDATE users SET otp_code=?, otp_expires_at=? WHERE id=?', [
      otp, formatMysqlDatetime(expiresAt), user.id,
    ]);
    await sendOtpEmail({ to: email, name: user.name, otp });

    res.json({ message: 'A new verification code has been sent to your email.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error resending code.' });
  }
}

// ------------------------------------------------------------------
// POST /api/auth/login
// ------------------------------------------------------------------
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    const user = rows[0];

    if (user.provider === 'google' && !user.password) {
      return res.status(400).json({ message: 'This account uses Google Sign-In. Please continue with Google.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    if (!user.is_verified) {
      return res.status(403).json({
        message: 'Please verify your email before logging in.',
        requiresOtp: true,
        email: user.email,
      });
    }

    const token = signToken(user);
    res.json({ message: 'Login successful', token, user: publicUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during login.' });
  }
}

// ------------------------------------------------------------------
// POST /api/auth/google — "Continue with Google" for signup + login.
// Frontend sends the Google ID token (credential) from Google Identity Services.
// Requires GOOGLE_CLIENT_ID to be set in backend/.env (see .env.example).
// ------------------------------------------------------------------
async function googleAuth(req, res) {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ message: 'Missing Google credential.' });
    }
    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(500).json({ message: 'Google Sign-In is not configured on the server yet.' });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    if (!email) {
      return res.status(400).json({ message: 'Could not read email from Google account.' });
    }

    const [rows] = await pool.query('SELECT * FROM users WHERE email = ? OR google_id = ?', [email, googleId]);
    let user;

    if (rows.length > 0) {
      user = rows[0];
      // Link Google to an existing local account if needed, and ensure it's verified.
      if (!user.google_id) {
        await pool.query('UPDATE users SET google_id=?, is_verified=1 WHERE id=?', [googleId, user.id]);
        user.google_id = googleId;
      }
    } else {
      const [result] = await pool.query(
        `INSERT INTO users (name, email, password, role, provider, google_id, is_verified)
         VALUES (?, ?, NULL, 'patient', 'google', ?, 1)`,
        [name || email.split('@')[0], email, googleId]
      );
      user = { id: result.insertId, name: name || email.split('@')[0], email, role: 'patient' };
    }

    const token = signToken(user);
    res.json({ message: 'Signed in with Google', token, user: publicUser(user), picture });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Google sign-in failed. Please try again.' });
  }
}

module.exports = { signup, doctorSignup, verifyOtp, resendOtp, login, googleAuth };
