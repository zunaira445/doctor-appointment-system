const nodemailer = require('nodemailer');
require('dotenv').config();

// Uses a Gmail address + Gmail "App Password" set in .env (EMAIL_USER / EMAIL_PASS).
// If email is not configured, we log the OTP to the console instead of crashing,
// so the app still works during local development.
const isEmailConfigured = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);

let transporter = null;
if (isEmailConfigured) {
  transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

async function sendMail({ to, subject, html }) {
  if (!isEmailConfigured) {
    console.log('\n=== EMAIL NOT CONFIGURED — printing message instead ===');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log(html.replace(/<[^>]+>/g, ' '));
    console.log('=========================================================\n');
    return;
  }

  const fromName = process.env.EMAIL_FROM_NAME || 'MediCare';
  await transporter.sendMail({
    from: `"${fromName}" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
}

function otpEmailTemplate({ name, otp }) {
  return `
    <div style="font-family: 'Poppins', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #faf9f6; border-radius: 12px;">
      <div style="text-align:center; margin-bottom: 24px;">
        <span style="display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;background:#ff6b5c;color:#fff;border-radius:8px;font-size:20px;font-weight:700;">+</span>
        <div style="font-size:20px;font-weight:700;color:#14555a;margin-top:8px;">MediCare</div>
      </div>
      <h2 style="color:#1f2937;margin-bottom:8px;">Verify your email</h2>
      <p style="color:#6b7280;font-size:15px;">Hi ${name || 'there'}, use the code below to verify your account. This code expires in 10 minutes.</p>
      <div style="text-align:center;margin:28px 0;">
        <span style="display:inline-block;letter-spacing:8px;font-size:32px;font-weight:700;color:#14555a;background:#e8f3f1;padding:16px 24px;border-radius:10px;">${otp}</span>
      </div>
      <p style="color:#6b7280;font-size:13px;">If you didn't request this, you can safely ignore this email.</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
      <p style="color:#9ca3af;font-size:12px;text-align:center;">© ${new Date().getFullYear()} MediCare. All rights reserved.</p>
    </div>
  `;
}

async function sendOtpEmail({ to, name, otp }) {
  await sendMail({
    to,
    subject: 'Your MediCare verification code',
    html: otpEmailTemplate({ name, otp }),
  });
}

function appointmentEmailTemplate({ patientName, doctorName, date, time, status }) {
  return `
    <div style="font-family: 'Poppins', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #faf9f6; border-radius: 12px;">
      <div style="text-align:center; margin-bottom: 24px;">
        <span style="display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;background:#ff6b5c;color:#fff;border-radius:8px;font-size:20px;font-weight:700;">+</span>
        <div style="font-size:20px;font-weight:700;color:#14555a;margin-top:8px;">MediCare</div>
      </div>
      <h2 style="color:#1f2937;margin-bottom:8px;">Appointment ${status}</h2>
      <p style="color:#6b7280;font-size:15px;">Hi ${patientName}, your appointment with <strong>${doctorName}</strong> on <strong>${date}</strong> at <strong>${time}</strong> is now <strong>${status}</strong>.</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
      <p style="color:#9ca3af;font-size:12px;text-align:center;">© ${new Date().getFullYear()} MediCare. All rights reserved.</p>
    </div>
  `;
}

async function sendAppointmentStatusEmail({ to, patientName, doctorName, date, time, status }) {
  try {
    await sendMail({
      to,
      subject: `Your appointment is ${status}`,
      html: appointmentEmailTemplate({ patientName, doctorName, date, time, status }),
    });
  } catch (err) {
    // Never block the main request if the notification email fails.
    console.error('Failed to send appointment status email:', err.message);
  }
}

module.exports = { sendMail, sendOtpEmail, sendAppointmentStatusEmail, isEmailConfigured };
