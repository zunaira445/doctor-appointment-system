const pool = require('../config/db');

// GET /api/doctors  (public - only active doctors, optional ?specialization=)
async function getDoctors(req, res) {
  try {
    const { specialization } = req.query;
    let query = 'SELECT * FROM doctors WHERE is_active = 1';
    let params = [];

    if (specialization) {
      query += ' AND specialization = ?';
      params.push(specialization);
    }
    query += ' ORDER BY name ASC';

    const [doctors] = await pool.query(query, params);
    res.json(doctors);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching doctors.' });
  }
}

// GET /api/doctors/all  (admin only - every doctor, active or not, so admin can manage all of them)
async function getAllDoctorsAdmin(req, res) {
  try {
    const [doctors] = await pool.query('SELECT * FROM doctors ORDER BY created_at DESC');
    res.json(doctors);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching doctors.' });
  }
}

// GET /api/doctors/me  (doctor only - their own profile)
async function getMyDoctorProfile(req, res) {
  try {
    const [rows] = await pool.query('SELECT * FROM doctors WHERE user_id = ?', [req.user.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Doctor profile not found.' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching your profile.' });
  }
}

// PUT /api/doctors/me  (doctor only - update their own profile)
async function updateMyDoctorProfile(req, res) {
  try {
    const { specialization, experience, fee, image, bio, available_days, available_time } = req.body;

    const [existing] = await pool.query('SELECT id FROM doctors WHERE user_id = ?', [req.user.id]);
    if (existing.length === 0) return res.status(404).json({ message: 'Doctor profile not found.' });

    await pool.query(
      `UPDATE doctors SET specialization=?, experience=?, fee=?, image=?, bio=?, available_days=?, available_time=? WHERE user_id=?`,
      [specialization, experience || 0, fee || 0, image || '', bio || '', available_days, available_time, req.user.id]
    );
    res.json({ message: 'Profile updated successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error updating your profile.' });
  }
}

// GET /api/doctors/:id
async function getDoctorById(req, res) {
  try {
    const [rows] = await pool.query('SELECT * FROM doctors WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Doctor not found.' });

    const doctor = rows[0];
    const isOwnerOrAdmin = req.user && (req.user.role === 'admin' || doctor.user_id === req.user.id);
    if (!doctor.is_active && !isOwnerOrAdmin) {
      return res.status(404).json({ message: 'Doctor not found.' });
    }

    res.json(doctor);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching doctor.' });
  }
}

// POST /api/doctors (admin only - manually add a doctor listing)
async function addDoctor(req, res) {
  try {
    const { name, specialization, experience, fee, image, available_days, available_time } = req.body;
    if (!name || !specialization) {
      return res.status(400).json({ message: 'Name and specialization are required.' });
    }

    const [result] = await pool.query(
      `INSERT INTO doctors (name, specialization, experience, fee, image, available_days, available_time, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
      [name, specialization, experience || 0, fee || 0, image || '', available_days || 'Mon-Sat', available_time || '9:00 AM - 5:00 PM']
    );

    res.status(201).json({ message: 'Doctor added successfully.', id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error adding doctor.' });
  }
}

// PUT /api/doctors/:id (admin only)
async function updateDoctor(req, res) {
  try {
    const { name, specialization, experience, fee, image, available_days, available_time } = req.body;
    const [result] = await pool.query(
      `UPDATE doctors SET name=?, specialization=?, experience=?, fee=?, image=?, available_days=?, available_time=? WHERE id=?`,
      [name, specialization, experience, fee, image, available_days, available_time, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Doctor not found.' });
    res.json({ message: 'Doctor updated successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error updating doctor.' });
  }
}

// PATCH /api/doctors/:id/toggle-active (admin only - show/hide a doctor from patients)
async function toggleDoctorActive(req, res) {
  try {
    const [rows] = await pool.query('SELECT is_active FROM doctors WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Doctor not found.' });

    const newStatus = rows[0].is_active ? 0 : 1;
    await pool.query('UPDATE doctors SET is_active = ? WHERE id = ?', [newStatus, req.params.id]);
    res.json({ message: newStatus ? 'Doctor activated.' : 'Doctor deactivated.', is_active: newStatus });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error updating doctor status.' });
  }
}

// DELETE /api/doctors/:id (admin only)
async function deleteDoctor(req, res) {
  try {
    const [result] = await pool.query('DELETE FROM doctors WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Doctor not found.' });
    res.json({ message: 'Doctor deleted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error deleting doctor.' });
  }
}

module.exports = {
  getDoctors,
  getAllDoctorsAdmin,
  getMyDoctorProfile,
  updateMyDoctorProfile,
  getDoctorById,
  addDoctor,
  updateDoctor,
  toggleDoctorActive,
  deleteDoctor,
};
