import { useEffect, useState } from 'react';
import api from '../api/axios';

const EMPTY_FORM = { name: '', specialization: '', experience: '', fee: '', image: '', available_days: 'Mon-Sat', available_time: '9:00 AM - 5:00 PM' };

export default function AdminDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');

  function load() {
    setLoading(true);
    api.get('/doctors/all').then((res) => setDoctors(res.data)).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function openAddForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(true);
    setError('');
  }

  function openEditForm(doc) {
    setForm({ ...doc });
    setEditingId(doc.id);
    setShowForm(true);
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      if (editingId) {
        await api.put(`/doctors/${editingId}`, form);
      } else {
        await api.post('/doctors', form);
      }
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save doctor.');
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this doctor? This cannot be undone.')) return;
    try {
      await api.delete(`/doctors/${id}`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete doctor.');
    }
  }

  async function handleToggleActive(id) {
    try {
      await api.patch(`/doctors/${id}/toggle-active`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update doctor status.');
    }
  }

  if (loading) return <div className="spinner" />;

  return (
    <div className="admin-panel">
      <div className="table-toolbar">
        <span>{doctors.length} doctors ({doctors.filter((d) => d.user_id).length} self-registered)</span>
        <button className="btn btn-primary" onClick={openAddForm}>+ Add Doctor</button>
      </div>

      {showForm && (
        <div className="card doctor-form-card">
          <h3>{editingId ? 'Edit Doctor' : 'Add New Doctor'}</h3>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit} className="doctor-form-grid">
            <div className="input-group">
              <label>Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="input-group">
              <label>Specialization</label>
              <input value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} required />
            </div>
            <div className="input-group">
              <label>Experience (years)</label>
              <input type="number" value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} />
            </div>
            <div className="input-group">
              <label>Fee (Rs.)</label>
              <input type="number" value={form.fee} onChange={(e) => setForm({ ...form, fee: e.target.value })} />
            </div>
            <div className="input-group">
              <label>Image URL</label>
              <input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="https://..." />
            </div>
            <div className="input-group">
              <label>Available Days</label>
              <input value={form.available_days} onChange={(e) => setForm({ ...form, available_days: e.target.value })} />
            </div>
            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
              <label>Available Time</label>
              <input value={form.available_time} onChange={(e) => setForm({ ...form, available_time: e.target.value })} />
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">{editingId ? 'Save Changes' : 'Add Doctor'}</button>
            </div>
          </form>
        </div>
      )}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Specialization</th>
              <th>Experience</th>
              <th>Fee</th>
              <th>Source</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {doctors.map((d) => (
              <tr key={d.id}>
                <td><strong>{d.name}</strong><div className="table-sub">{d.email || '—'}</div></td>
                <td>{d.specialization}</td>
                <td>{d.experience} yrs</td>
                <td>Rs. {d.fee}</td>
                <td className="table-sub">{d.user_id ? 'Self-registered' : 'Added by admin'}</td>
                <td>
                  <span className={`badge ${d.is_active ? 'badge-confirmed' : 'badge-cancelled'}`}>
                    {d.is_active ? 'Visible' : 'Hidden'}
                  </span>
                </td>
                <td className="table-actions">
                  <button className="btn btn-outline" onClick={() => handleToggleActive(d.id)}>
                    {d.is_active ? 'Hide' : 'Show'}
                  </button>
                  <button className="btn btn-outline" onClick={() => openEditForm(d)}>Edit</button>
                  <button className="btn btn-danger" onClick={() => handleDelete(d.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
