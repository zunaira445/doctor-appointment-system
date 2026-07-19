// Run this once to create all tables + seed doctors: node migrate.js
const pool = require('./config/db');

const statements = [
  `CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) DEFAULT NULL,
    phone VARCHAR(20),
    role ENUM('patient', 'doctor', 'admin') DEFAULT 'patient',
    provider ENUM('local', 'google') DEFAULT 'local',
    google_id VARCHAR(100) DEFAULT NULL,
    is_verified TINYINT(1) DEFAULT 0,
    otp_code VARCHAR(10) DEFAULT NULL,
    otp_expires_at DATETIME DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS doctors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT DEFAULT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) DEFAULT NULL,
    specialization VARCHAR(100) NOT NULL,
    experience INT DEFAULT 0,
    fee DECIMAL(10,2) DEFAULT 0,
    image VARCHAR(255) DEFAULT '',
    bio TEXT,
    available_days VARCHAR(100) DEFAULT 'Mon-Sat',
    available_time VARCHAR(100) DEFAULT '9:00 AM - 5:00 PM',
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
  )`,
  `CREATE TABLE IF NOT EXISTS appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    doctor_id INT NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time VARCHAR(20) NOT NULL,
    reason VARCHAR(255),
    status ENUM('pending', 'confirmed', 'completed', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
  )`,
];

const seedDoctors = `INSERT INTO doctors (name, specialization, experience, fee, image, bio, available_days, available_time, is_active) VALUES
  ('Dr. Ahmed Khan', 'Cardiologist', 12, 2000.00, 'https://randomuser.me/api/portraits/men/32.jpg', 'Senior cardiologist with 12 years of experience in interventional cardiology.', 'Mon-Fri', '10:00 AM - 4:00 PM', 1),
  ('Dr. Sara Malik', 'Dermatologist', 8, 1500.00, 'https://randomuser.me/api/portraits/women/44.jpg', 'Skin care specialist focused on medical and cosmetic dermatology.', 'Mon-Sat', '9:00 AM - 3:00 PM', 1),
  ('Dr. Bilal Hussain', 'Dentist', 6, 1200.00, 'https://randomuser.me/api/portraits/men/45.jpg', 'General and cosmetic dentistry for all ages.', 'Mon-Sat', '11:00 AM - 6:00 PM', 1),
  ('Dr. Ayesha Raza', 'Pediatrician', 10, 1800.00, 'https://randomuser.me/api/portraits/women/68.jpg', 'Dedicated pediatrician caring for infants, children, and adolescents.', 'Mon-Fri', '9:00 AM - 2:00 PM', 1),
  ('Dr. Usman Tariq', 'Orthopedic', 15, 2500.00, 'https://randomuser.me/api/portraits/men/76.jpg', 'Orthopedic surgeon specializing in sports injuries and joint replacement.', 'Tue-Sat', '10:00 AM - 5:00 PM', 1),
  ('Dr. Hina Sheikh', 'Gynecologist', 9, 2000.00, 'https://randomuser.me/api/portraits/women/22.jpg', 'Women''s health specialist with a focus on prenatal and reproductive care.', 'Mon-Sat', '10:00 AM - 4:00 PM', 1)`;

async function migrate() {
  try {
    console.log('Connecting to database...');
    for (const [i, sql] of statements.entries()) {
      await pool.query(sql);
      console.log(`✅ Table ${i + 1}/3 created (or already existed)`);
    }

    const [existing] = await pool.query('SELECT id FROM doctors LIMIT 1');
    if (existing.length === 0) {
      await pool.query(seedDoctors);
      console.log('✅ Sample doctors added');
    } else {
      console.log('ℹ️  Doctors already exist, skipping seed data');
    }

    console.log('\n🎉 Migration complete! Your database is ready.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

migrate();