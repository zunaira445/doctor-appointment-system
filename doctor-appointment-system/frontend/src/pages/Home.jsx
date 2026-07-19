import { Link } from 'react-router-dom';
import './Home.css';

const specializations = [
  { name: 'Cardiologist', icon: '❤️' },
  { name: 'Dermatologist', icon: '🩺' },
  { name: 'Dentist', icon: '🦷' },
  { name: 'Pediatrician', icon: '👶' },
  { name: 'Orthopedic', icon: '🦴' },
  { name: 'Gynecologist', icon: '🌸' },
];

export default function Home() {
  return (
    <div>
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-text">
            <span className="eyebrow">Trusted by 12,000+ patients</span>
            <h1>Book a doctor's appointment in under a minute.</h1>
            <p>
              Compare specialists, check real availability, and confirm your visit —
              no phone calls, no waiting rooms, no guesswork.
            </p>
            <div className="hero-actions">
              <Link to="/doctors" className="btn btn-primary">Find a Doctor</Link>
              <Link to="/signup" className="btn btn-outline">Create Account</Link>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-card">
              <div className="hero-card-row">
                <div className="hero-avatar" />
                <div>
                  <strong>Dr. Ahmed Khan</strong>
                  <p>Cardiologist</p>
                </div>
                <span className="badge badge-confirmed">Confirmed</span>
              </div>
              <div className="hero-card-divider" />
              <p className="hero-card-time">Tomorrow · 10:30 AM</p>
            </div>
          </div>
        </div>
      </section>

      <section className="container specializations">
        <h2>Browse by specialization</h2>
        <p className="section-sub">Find the right specialist for your condition.</p>
        <div className="spec-grid">
          {specializations.map((s) => (
            <Link to={`/doctors?specialization=${encodeURIComponent(s.name)}`} key={s.name} className="spec-item">
              <span className="spec-icon">{s.icon}</span>
              <span>{s.name}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="container how-it-works">
        <h2>How it works</h2>
        <div className="steps-grid">
          <div className="step">
            <span className="step-num">1</span>
            <h4>Choose a specialist</h4>
            <p>Browse doctors by specialization, experience, or fee.</p>
          </div>
          <div className="step">
            <span className="step-num">2</span>
            <h4>Pick a time slot</h4>
            <p>Select a date and time that works with your schedule.</p>
          </div>
          <div className="step">
            <span className="step-num">3</span>
            <h4>Get confirmed</h4>
            <p>Track your appointment status from your dashboard.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
