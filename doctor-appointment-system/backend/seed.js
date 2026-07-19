// Run this once after setting up the database: npm run seed
// Creates a default admin account so you can log into the Admin Panel.

const bcrypt = require('bcryptjs');
const pool = require('./config/db');

async function createAdmin() {
  try {
    const email = 'admin@clinic.com';
    const plainPassword = 'admin123';

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      console.log('Admin already exists. Email:', email);
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    await pool.query(
      'INSERT INTO users (name, email, password, phone, role, provider, is_verified) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['Admin', email, hashedPassword, '03000000000', 'admin', 'local', 1]
    );

    console.log('✅ Admin account created!');
    console.log('   Email:   ', email);
    console.log('   Password:', plainPassword);
    process.exit(0);
  } catch (err) {
    console.error('Error creating admin:', err);
    process.exit(1);
  }
}

createAdmin();
