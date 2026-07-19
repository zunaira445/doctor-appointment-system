const pool = require('../config/db');
const { sendAppointmentStatusEmail } = require('../utils/mailer');

// POST /api/appointments (logged-in patient)
async function bookAppointment(req, res) {
  try {
    const { doctor_id, appointment_date, appointment_time, reason } = req.body;
    const user_id = req.user.id;

    if (!doctor_id || !appointment_date || !appointment_time) {
      return res.status(400).json({ message: 'Doctor, date, and time are required.' });
    }

    const [result] = await pool.query(
      `INSERT INTO appointments (user_id, doctor_id, appointment_date, appointment_time, reason, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [user_id, doctor_id, appointment_date, appointment_time, reason || '']
    );

    res.status(201).json({ message: 'Appointment booked successfully.', id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error booking appointment.' });
  }
}

// GET /api/appointments/my (logged-in patient's own appointments)
async function getMyAppointments(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT a.*, d.name AS doctor_name, d.specialization, d.image
       FROM appointments a
       JOIN doctors d ON a.doctor_id = d.id
       WHERE a.user_id = ?
       ORDER BY a.appointment_date DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching appointments.' });
  }
}

// GET /api/appointments/doctor (logged-in doctor's own appointments)
async function getDoctorAppointments(req, res) {
  try {
    const [doctorRows] = await pool.query('SELECT id FROM doctors WHERE user_id = ?', [req.user.id]);
    if (doctorRows.length === 0) return res.status(404).json({ message: 'Doctor profile not found.' });

    const doctorId = doctorRows[0].id;
    const [rows] = await pool.query(
      `SELECT a.*, u.name AS patient_name, u.email AS patient_email, u.phone AS patient_phone
       FROM appointments a
       JOIN users u ON a.user_id = u.id
       WHERE a.doctor_id = ?
       ORDER BY a.appointment_date DESC`,
      [doctorId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching appointments.' });
  }
}

// GET /api/appointments (admin only - all appointments)
async function getAllAppointments(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT a.*, u.name AS patient_name, u.email AS patient_email,
              d.name AS doctor_name, d.specialization
       FROM appointments a
       JOIN users u ON a.user_id = u.id
       JOIN doctors d ON a.doctor_id = d.id
       ORDER BY a.appointment_date DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching appointments.' });
  }
}

// PUT /api/appointments/:id/status (admin, or the doctor the appointment belongs to)
async function updateAppointmentStatus(req, res) {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value.' });
    }

    const [rows] = await pool.query(
      `SELECT a.*, u.name AS patient_name, u.email AS patient_email, d.name AS doctor_name, d.user_id AS doctor_user_id
       FROM appointments a
       JOIN users u ON a.user_id = u.id
       JOIN doctors d ON a.doctor_id = d.id
       WHERE a.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Appointment not found.' });

    const appointment = rows[0];
    const isOwnerDoctor = req.user.role === 'doctor' && appointment.doctor_user_id === req.user.id;
    if (req.user.role !== 'admin' && !isOwnerDoctor) {
      return res.status(403).json({ message: 'Not authorized to update this appointment.' });
    }

    await pool.query('UPDATE appointments SET status = ? WHERE id = ?', [status, req.params.id]);

    sendAppointmentStatusEmail({
      to: appointment.patient_email,
      patientName: appointment.patient_name,
      doctorName: appointment.doctor_name,
      date: new Date(appointment.appointment_date).toDateString(),
      time: appointment.appointment_time,
      status,
    });

    res.json({ message: 'Appointment status updated.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error updating status.' });
  }
}

// DELETE /api/appointments/:id (patient can cancel own, or admin)
async function cancelAppointment(req, res) {
  try {
    const appointmentId = req.params.id;
    const [rows] = await pool.query('SELECT * FROM appointments WHERE id = ?', [appointmentId]);
    if (rows.length === 0) return res.status(404).json({ message: 'Appointment not found.' });

    const appointment = rows[0];
    if (req.user.role !== 'admin' && appointment.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to cancel this appointment.' });
    }

    await pool.query('UPDATE appointments SET status = ? WHERE id = ?', ['cancelled', appointmentId]);
    res.json({ message: 'Appointment cancelled.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error cancelling appointment.' });
  }
}

module.exports = {
  bookAppointment,
  getMyAppointments,
  getDoctorAppointments,
  getAllAppointments,
  updateAppointmentStatus,
  cancelAppointment,
};
