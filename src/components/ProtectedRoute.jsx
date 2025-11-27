import { Navigate } from 'react-router-dom';
import { isAuthenticated, isTokenExpired, getToken } from '../utils/auth';

function ProtectedRoute({ children }) {
  const token = getToken();
  
  if (!isAuthenticated() || isTokenExpired(token)) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

export default ProtectedRoute;

