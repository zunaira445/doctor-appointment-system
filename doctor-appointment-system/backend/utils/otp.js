// Generates a 6-digit numeric OTP and its expiry timestamp (10 minutes from now).
function generateOtp() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  return { otp, expiresAt };
}

// Formats a Date as "YYYY-MM-DD HH:MM:SS" using LOCAL time components (not UTC).
// This matters because mysql2 reads DATETIME columns back as local-time Date
// objects. If we wrote UTC here, the read-back value would be off by your
// timezone offset (e.g. 5 hours in Pakistan), making OTPs look expired instantly.
function formatMysqlDatetime(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

module.exports = { generateOtp, formatMysqlDatetime };