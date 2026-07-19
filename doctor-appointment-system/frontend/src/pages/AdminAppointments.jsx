import { useEffect, useState } from 'react';
import api from '../api/axios';

const STATUS_OPTIONS = ['pending', 'confirmed', 'completed', 'cancelled'];

export default function AdminAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  function load() {
    setLoading(true);
    api.get('/appointments')
      .then((res) => setAppointments(res.data))
      .catch(() => setAppointments([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleStatusChange(id, status) {
    try {
      await api.put(`/appointments/${id}/status`, { status });
      setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status.');
    }
  }

  const filtered = filter === 'all' ? appointments : appointments.filter((a) => a.status === filter);

  if (loading) return <div className="spinner" />;

  return (
    <div className="admin-panel">
      <div className="table-toolbar">
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All statuses ({appointments.length})</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s} ({appointments.filter((a) => a.status === s).length})</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state"><p>No appointments found.</p></div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Date</th>
                <th>Time</th>
                <th>Reason</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id}>
                  <td>
                    <strong>{a.patient_name}</strong>
                    <div className="table-sub">{a.patient_email}</div>
                  </td>
                  <td>
                    {a.doctor_name}
                    <div className="table-sub">{a.specialization}</div>
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
  );
}
