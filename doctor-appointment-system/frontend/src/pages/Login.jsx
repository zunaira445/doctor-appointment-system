import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import GoogleButton from '../components/GoogleButton';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

function redirectPathForRole(role) {
  if (role === 'admin') return '/admin';
  if (role === 'doctor') return '/doctor/dashboard';
  return '/doctors';
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.user, res.data.token);
      navigate(redirectPathForRole(res.data.user.role));
    } catch (err) {
      const data = err.response?.data;
      if (data?.requiresOtp) {
        navigate('/verify-otp', { state: { email: data.email || email } });
        return;
      }
      setError(data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <h2>Welcome back</h2>
        <p className="auth-sub">Log in to manage your appointments.</p>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="google-btn-row">
          <GoogleButton onError={setError} />
        </div>
        <div className="auth-divider"><span>or log in with email</span></div>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account? <Link to="/signup">Sign up</Link>
        </p>
        <p className="auth-footer">
          Are you a doctor? <Link to="/doctor-signup">Register as a Doctor</Link>
        </p>
        <p className="auth-hint">Admin demo login: admin@clinic.com / admin123</p>
      </div>
    </div>
  );
}
