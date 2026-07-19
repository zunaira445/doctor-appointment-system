import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Usage:
//   <ProtectedRoute>...</ProtectedRoute>              -> any logged-in user
//   <ProtectedRoute adminOnly>...</ProtectedRoute>     -> admin only
//   <ProtectedRoute role="doctor">...</ProtectedRoute> -> a specific role
export default function ProtectedRoute({ children, adminOnly = false, role = null }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;

  return children;
}
