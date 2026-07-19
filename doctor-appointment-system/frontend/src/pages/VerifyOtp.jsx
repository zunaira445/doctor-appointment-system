import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

function redirectPathForRole(role) {
  if (role === 'admin') return '/admin';
  if (role === 'doctor') return '/doctor/dashboard';
  return '/doctors';
}

export default function VerifyOtp() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();

  const email = location.state?.email || '';
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  if (!email) {
    return (
      <div className="auth-page">
        <div className="card auth-card">
          <h2>Nothing to verify</h2>
          <p className="auth-sub">Please sign up first to receive a verification code.</p>
          <Link to="/signup" className="btn btn-primary" style={{ width: '100%' }}>Go to Sign Up</Link>
        </div>
      </div>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);
    try {
      const res = await api.post('/auth/verify-otp', { email, otp });
      login(res.data.user, res.data.token);
      navigate(redirectPathForRole(res.data.user.role));
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError('');
    setInfo('');
    setResending(true);
    try {
      await api.post('/auth/resend-otp', { email });
      setInfo('A new code has been sent to your email.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not resend code.');
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <h2>Verify your email</h2>
        <p className="auth-sub">We sent a 6-digit code to <strong>{email}</strong>.</p>

        {error && <div className="alert alert-error">{error}</div>}
        {info && <div className="alert alert-success">{info}</div>}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Verification Code</label>
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              required
              inputMode="numeric"
              maxLength={6}
              placeholder="123456"
              style={{ letterSpacing: '6px', fontSize: '20px', textAlign: 'center' }}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading || otp.length !== 6}>
            {loading ? 'Verifying...' : 'Verify & Continue'}
          </button>
        </form>

        <p className="auth-footer">
          Didn't get a code?{' '}
          <button type="button" className="btn btn-ghost" style={{ padding: '4px 8px' }} onClick={handleResend} disabled={resending}>
            {resending ? 'Sending...' : 'Resend code'}
          </button>
        </p>
      </div>
    </div>
  );
}
