import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import DoctorCard from '../components/DoctorCard';
import './Doctors.css';

export default function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const specialization = searchParams.get('specialization') || '';

  useEffect(() => {
    setLoading(true);
    const query = specialization ? `?specialization=${encodeURIComponent(specialization)}` : '';
    api.get(`/doctors${query}`)
      .then((res) => setDoctors(res.data))
      .catch(() => setDoctors([]))
      .finally(() => setLoading(false));
  }, [specialization]);

  const allSpecializations = ['Cardiologist', 'Dermatologist', 'Dentist', 'Pediatrician', 'Orthopedic', 'Gynecologist'];

  return (
    <div className="container doctors-page">
      <div className="doctors-header">
        <h1>Find a Doctor</h1>
        <p>Browse our verified specialists and book your visit today.</p>
      </div>

      <div className="filter-bar">
        <button
          className={`filter-chip ${!specialization ? 'active' : ''}`}
          onClick={() => setSearchParams({})}
        >
          All
        </button>
        {allSpecializations.map((s) => (
          <button
            key={s}
            className={`filter-chip ${specialization === s ? 'active' : ''}`}
            onClick={() => setSearchParams({ specialization: s })}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="spinner" />
      ) : doctors.length === 0 ? (
        <div className="empty-state">
          <h3>No doctors found</h3>
          <p>Try a different specialization or check back later.</p>
        </div>
      ) : (
        <div className="doctors-grid">
          {doctors.map((doc) => (
            <DoctorCard key={doc.id} doctor={doc} />
          ))}
        </div>
      )}
    </div>
  );
}
