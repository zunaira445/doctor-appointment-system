import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import './DoctorDetail.css';

const TIME_SLOTS = ['09:00 AM', '10:00 AM', '11:00 AM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM'];

export default function DoctorDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get(`/doctors/${id}`).then((res) => setDoctor(res.data)).catch(() => setDoctor(null));
  }, [id]);

  async function handleBooking(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!user) {
      navigate('/login');
      return;
    }
    if (!date || !time) {
      setError('Please select both a date and a time slot.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/appointments', {
        doctor_id: id,
        appointment_date: date,
        appointment_time: time,
        reason,
      });
      setSuccess('Appointment booked! Redirecting to your appointments...');
      setTimeout(() => navigate('/my-appointments'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!doctor) return <div className="spinner" />;

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="container detail-page">
      <div className="detail-grid">
        <div className="card doctor-profile">
          <img src={doctor.image} alt={doctor.name} className="profile-img" />
          <h2>{doctor.name}</h2>
          <p className="profile-spec">{doctor.specialization}</p>
          <div className="profile-stats">
            <div><strong>{doctor.experience}</strong><span>Years Exp.</span></div>
            <div><strong>Rs. {doctor.fee}</strong><span>Consultation Fee</span></div>
          </div>
          <p className="profile-availability">
            <strong>Available:</strong> {doctor.available_days}<br />
            <strong>Hours:</strong> {doctor.available_time}
          </p>
        </div>

        <div className="card booking-form">
          <h3>Book an Appointment</h3>
          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <form onSubmit={handleBooking}>
            <div className="input-group">
              <label>Select Date</label>
              <input type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>

            <div className="input-group">
              <label>Select Time Slot</label>
              <div className="time-slots">
                {TIME_SLOTS.map((slot) => (
                  <button
                    type="button"
                    key={slot}
                    className={`time-slot ${time === slot ? 'active' : ''}`}
                    onClick={() => setTime(slot)}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            <div className="input-group">
              <label>Reason for visit (optional)</label>
              <textarea rows="3" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Briefly describe your symptoms or reason for the visit" />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submitting}>
              {submitting ? 'Booking...' : user ? 'Confirm Appointment' : 'Login to Book'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
