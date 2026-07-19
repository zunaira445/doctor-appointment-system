import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import './MyAppointments.css';

export default function MyAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);

  function loadAppointments() {
    setLoading(true);
    api.get('/appointments/my')
      .then((res) => setAppointments(res.data))
      .catch(() => setAppointments([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadAppointments(); }, []);

  async function handleCancel(id) {
    if (!window.confirm('Cancel this appointment?')) return;
    setCancellingId(id);
    try {
      await api.delete(`/appointments/${id}`);
      loadAppointments();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not cancel appointment.');
    } finally {
      setCancellingId(null);
    }
  }

  if (loading) return <div className="spinner" />;

  return (
    <div className="container appointments-page">
      <h1>My Appointments</h1>

      {appointments.length === 0 ? (
        <div className="empty-state">
          <h3>No appointments yet</h3>
          <p>Book your first appointment with a specialist.</p>
          <Link to="/doctors" className="btn btn-primary" style={{ marginTop: 16 }}>Find a Doctor</Link>
        </div>
      ) : (
        <div className="appointments-list">
          {appointments.map((a) => (
            <div className="card appointment-item" key={a.id}>
              <img src={a.image} alt={a.doctor_name} className="appt-img" />
              <div className="appt-details">
                <h4>{a.doctor_name}</h4>
                <p className="appt-spec">{a.specialization}</p>
                <p className="appt-datetime">{new Date(a.appointment_date).toDateString()} · {a.appointment_time}</p>
                {a.reason && <p className="appt-reason">"{a.reason}"</p>}
              </div>
              <div className="appt-actions">
                <span className={`badge badge-${a.status}`}>{a.status}</span>
                {(a.status === 'pending' || a.status === 'confirmed') && (
                  <button
                    className="btn btn-danger"
                    onClick={() => handleCancel(a.id)}
                    disabled={cancellingId === a.id}
                  >
                    {cancellingId === a.id ? 'Cancelling...' : 'Cancel'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
