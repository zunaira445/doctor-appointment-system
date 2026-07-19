import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="navbar-logo">
          <span className="logo-icon">+</span> MediCare
        </Link>

        <nav className="navbar-links">
          <Link to="/">Home</Link>
          <Link to="/doctors">Find Doctors</Link>
          {user && user.role === 'patient' && <Link to="/my-appointments">My Appointments</Link>}
          {user && user.role === 'doctor' && <Link to="/doctor/dashboard">My Dashboard</Link>}
          {user && user.role === 'admin' && <Link to="/admin">Admin Panel</Link>}
          {!user && <Link to="/doctor-signup">For Doctors</Link>}
        </nav>

        <div className="navbar-actions">
          {user ? (
            <>
              <span className="navbar-user">Hi, {user.name.split(' ')[0]}</span>
              <button className="btn btn-ghost" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline">Login</Link>
              <Link to="/signup" className="btn btn-primary">Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
