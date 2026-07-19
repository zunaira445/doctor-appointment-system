import { Link } from 'react-router-dom';
import './DoctorCard.css';

export default function DoctorCard({ doctor }) {
  return (
    <div className="card doctor-card">
      <img src={doctor.image || 'https://via.placeholder.com/150'} alt={doctor.name} className="doctor-img" />
      <div className="doctor-info">
        <h3>{doctor.name}</h3>
        <p className="doctor-spec">{doctor.specialization}</p>
        <div className="doctor-meta">
          <span>{doctor.experience} yrs exp</span>
          <span className="dot">•</span>
          <span>Rs. {doctor.fee}</span>
        </div>
        <p className="doctor-time">{doctor.available_days} · {doctor.available_time}</p>
        <Link to={`/doctors/${doctor.id}`} className="btn btn-primary doctor-book-btn">
          Book Appointment
        </Link>
      </div>
    </div>
  );
}
