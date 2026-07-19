const jwt = require('jsonwebtoken');
require('dotenv').config();

// Verify token and attach user info to request
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role }
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired token.' });
  }
}

// Attach user info if a valid token is present, but never blocks the request.
// Useful for public routes that behave slightly differently for logged-in users.
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return next();

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    // Ignore invalid/expired tokens on optional routes.
  }
  next();
}

// Only allow admin role
function verifyAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required.' });
  }
  next();
}

// Only allow doctor role
function verifyDoctor(req, res, next) {
  if (req.user.role !== 'doctor') {
    return res.status(403).json({ message: 'Doctor access required.' });
  }
  next();
}

// Allow either an admin, or a doctor acting on their own resource
function verifyAdminOrDoctor(req, res, next) {
  if (req.user.role === 'admin' || req.user.role === 'doctor') {
    return next();
  }
  return res.status(403).json({ message: 'Not authorized.' });
}

module.exports = { verifyToken, optionalAuth, verifyAdmin, verifyDoctor, verifyAdminOrDoctor };
