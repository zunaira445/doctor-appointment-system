import { useState } from 'react';
import AdminDoctors from './AdminDoctors';
import AdminAppointments from './AdminAppointments';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const [tab, setTab] = useState('appointments');

  return (
    <div className="container admin-page">
      <h1>Admin Dashboard</h1>
      <p className="admin-sub">Manage doctors and patient appointments.</p>

      <div className="admin-tabs">
        <button className={tab === 'appointments' ? 'active' : ''} onClick={() => setTab('appointments')}>
          Appointments
        </button>
        <button className={tab === 'doctors' ? 'active' : ''} onClick={() => setTab('doctors')}>
          Doctors
        </button>
      </div>

      {tab === 'appointments' ? <AdminAppointments /> : <AdminDoctors />}
    </div>
  );
}
