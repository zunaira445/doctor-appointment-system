const express = require('express');
const router = express.Router();
const {
  bookAppointment,
  getMyAppointments,
  getDoctorAppointments,
  getAllAppointments,
  updateAppointmentStatus,
  cancelAppointment,
} = require('../controllers/appointmentController');
const { verifyToken, verifyAdmin, verifyDoctor, verifyAdminOrDoctor } = require('../middleware/auth');

// Patient routes (logged in)
router.post('/', verifyToken, bookAppointment);
router.get('/my', verifyToken, getMyAppointments);
router.delete('/:id', verifyToken, cancelAppointment);

// Doctor routes (logged in)
router.get('/doctor', verifyToken, verifyDoctor, getDoctorAppointments);

// Admin routes
router.get('/', verifyToken, verifyAdmin, getAllAppointments);

// Status can be updated by an admin, or by the doctor who owns the appointment
router.put('/:id/status', verifyToken, verifyAdminOrDoctor, updateAppointmentStatus);

module.exports = router;
