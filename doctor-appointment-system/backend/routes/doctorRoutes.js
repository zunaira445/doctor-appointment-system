const express = require('express');
const router = express.Router();
const {
  getDoctors,
  getAllDoctorsAdmin,
  getMyDoctorProfile,
  updateMyDoctorProfile,
  getDoctorById,
  addDoctor,
  updateDoctor,
  toggleDoctorActive,
  deleteDoctor,
} = require('../controllers/doctorController');
const { verifyToken, optionalAuth, verifyAdmin, verifyDoctor } = require('../middleware/auth');

// Public routes
router.get('/', getDoctors);

// Admin: manage every doctor listing (active or not)
router.get('/all', verifyToken, verifyAdmin, getAllDoctorsAdmin);

// Doctor: manage own profile — declared before "/:id" so "me" isn't read as an id
router.get('/me', verifyToken, verifyDoctor, getMyDoctorProfile);
router.put('/me', verifyToken, verifyDoctor, updateMyDoctorProfile);

router.get('/:id', optionalAuth, getDoctorById);

// Admin-only routes
router.post('/', verifyToken, verifyAdmin, addDoctor);
router.put('/:id', verifyToken, verifyAdmin, updateDoctor);
router.patch('/:id/toggle-active', verifyToken, verifyAdmin, toggleDoctorActive);
router.delete('/:id', verifyToken, verifyAdmin, deleteDoctor);

module.exports = router;
