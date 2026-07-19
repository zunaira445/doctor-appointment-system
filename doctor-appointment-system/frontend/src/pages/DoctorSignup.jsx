import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import './Auth.css';
import './DoctorSignup.css';

const EMPTY_FORM = {
  name: '', email: '', password: '', phone: '',
  specialization: '', experience: '', fee: '', image: '', bio: '',
  available_days: 'Mon-Sat', available_time: '9:00 AM - 5:00 PM',
};

export default function DoctorSignup() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/doctor-signup', form);
      navigate('/verify-otp', { state: { email: res.data.email || form.email } });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="card auth-card doctor-signup-card">
        <h2>Join MediCare as a Doctor</h2>
        <p className="auth-sub">Create your own profile and start receiving appointments from patients.</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="doctor-form-grid">
          <div className="input-group">
            <label>Full Name</label>
            <input name="name" value={form.name} onChange={handleChange} required placeholder="Dr. Ali Raza" />
          </div>
          <div className="input-group">
            <label>Email</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} required placeholder="doctor@example.com" />
          </div>
          <div className="input-group">
            <label>Phone</label>
            <input name="phone" value={form.phone} onChange={handleChange} placeholder="03001234567" />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input type="password" name="password" value={form.password} onChange={handleChange} required minLength={6} placeholder="At least 6 characters" />
          </div>

          <div className="input-group">
            <label>Specialization</label>
            <input name="specialization" value={form.specialization} onChange={handleChange} required placeholder="Cardiologist" />
          </div>
          <div className="input-group">
            <label>Experience (years)</label>
            <input type="number" min="0" name="experience" value={form.experience} onChange={handleChange} placeholder="5" />
          </div>
          <div className="input-group">
            <label>Consultation Fee (Rs.)</label>
            <input type="number" min="0" name="fee" value={form.fee} onChange={handleChange} placeholder="1500" />
          </div>
          <div className="input-group">
            <label>Profile Image URL</label>
            <input name="image" value={form.image} onChange={handleChange} placeholder="https://..." />
          </div>
          <div className="input-group">
            <label>Available Days</label>
            <input name="available_days" value={form.available_days} onChange={handleChange} placeholder="Mon-Sat" />
          </div>
          <div className="input-group">
            <label>Available Time</label>
            <input name="available_time" value={form.available_time} onChange={handleChange} placeholder="9:00 AM - 5:00 PM" />
          </div>
          <div className="input-group" style={{ gridColumn: '1 / -1' }}>
            <label>Short Bio</label>
            <textarea rows="3" name="bio" value={form.bio} onChange={handleChange} placeholder="Tell patients about your background and expertise" />
          </div>

          <div className="form-actions" style={{ gridColumn: '1 / -1' }}>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Creating profile...' : 'Register as a Doctor'}
            </button>
          </div>
        </form>

        <p className="auth-footer">
          Already registered? <Link to="/login">Log in</Link>
        </p>
        <p className="auth-footer">
          Not a doctor? <Link to="/signup">Sign up as a patient</Link>
        </p>
      </div>
    </div>
  );
}
