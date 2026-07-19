import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import './DoctorDashboard.css';

const STATUS_OPTIONS = ['pending', 'confirmed', 'completed', 'cancelled'];

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('appointments');
  const [appointments, setAppointments] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  function loadAppointments() {
    return api.get('/appointments/doctor').then((res) => setAppointments(res.data)).catch(() => setAppointments([]));
  }
  function loadProfile() {
    return api.get('/doctors/me').then((res) => setProfile(res.data)).catch(() => setProfile(null));
  }

  useEffect(() => {
    setLoading(true);
    Promise.all([loadAppointments(), loadProfile()]).finally(() => setLoading(false));
  }, []);

  async function handleStatusChange(id, status) {
    try {
      await api.put(`/appointments/${id}/status`, { status });
      setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status.');
    }
  }

  async function handleProfileSave(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      await api.put('/doctors/me', profile);
      setSuccess('Profile updated successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  }

  const upcoming = appointments.filter((a) => a.status === 'pending' || a.status === 'confirmed').length;

  if (loading) return <div className="spinner" />;

  return (
    <div className="container admin-page">
      <h1>Welcome, {user?.name?.split(' ')[0]}</h1>
      <p className="admin-sub">Manage your appointments and public profile.</p>

      <div className="doctor-stats">
        <div className="card stat-card">
          <span className="stat-num">{appointments.length}</span>
          <span className="stat-label">Total Appointments</span>
        </div>
        <div className="card stat-card">
          <span className="stat-num">{upcoming}</span>
          <span className="stat-label">Pending / Confirmed</span>
        </div>
        <div className="card stat-card">
          <span className="stat-num">{appointments.filter((a) => a.status === 'completed').length}</span>
          <span className="stat-label">Completed</span>
        </div>
      </div>

      <div className="admin-tabs">
        <button className={tab === 'appointments' ? 'active' : ''} onClick={() => setTab('appointments')}>
          My Appointments
        </button>
        <button className={tab === 'profile' ? 'active' : ''} onClick={() => setTab('profile')}>
          My Profile
        </button>
      </div>

      {tab === 'appointments' ? (
        <div className="admin-panel">
          {appointments.length === 0 ? (
            <div className="empty-state"><p>No appointments yet. Patients will appear here once they book you.</p></div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Reason</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <strong>{a.patient_name}</strong>
                        <div className="table-sub">{a.patient_email}{a.patient_phone ? ` · ${a.patient_phone}` : ''}</div>
                      </td>
                      <td>{new Date(a.appointment_date).toLocaleDateString()}</td>
                      <td>{a.appointment_time}</td>
                      <td className="table-reason">{a.reason || '—'}</td>
                      <td>
                        <select
                          className={`status-select status-${a.status}`}
                          value={a.status}
                          onChange={(e) => handleStatusChange(a.id, e.target.value)}
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="card doctor-form-card">
          <h3>Public Profile</h3>
          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}
          {profile && (
            <form onSubmit={handleProfileSave} className="doctor-form-grid">
              <div className="input-group">
                <label>Specialization</label>
                <input value={profile.specialization} onChange={(e) => setProfile({ ...profile, specialization: e.target.value })} required />
              </div>
              <div className="input-group">
                <label>Experience (years)</label>
                <input type="number" value={profile.experience} onChange={(e) => setProfile({ ...profile, experience: e.target.value })} />
              </div>
              <div className="input-group">
                <label>Fee (Rs.)</label>
                <input type="number" value={profile.fee} onChange={(e) => setProfile({ ...profile, fee: e.target.value })} />
              </div>
              <div className="input-group">
                <label>Image URL</label>
                <input value={profile.image} onChange={(e) => setProfile({ ...profile, image: e.target.value })} placeholder="https://..." />
              </div>
              <div className="input-group">
                <label>Available Days</label>
                <input value={profile.available_days} onChange={(e) => setProfile({ ...profile, available_days: e.target.value })} />
              </div>
              <div className="input-group">
                <label>Available Time</label>
                <input value={profile.available_time} onChange={(e) => setProfile({ ...profile, available_time: e.target.value })} />
              </div>
              <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                <label>Bio</label>
                <textarea rows="3" value={profile.bio || ''} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} />
              </div>
              <div className="form-actions" style={{ gridColumn: '1 / -1' }}>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
