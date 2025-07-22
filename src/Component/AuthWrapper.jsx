import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UserLogin from './UserLogin';

const AuthWrapper = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = () => {
      const userData = localStorage.getItem('loggedInUser');
      
      if (!userData) {
        navigate('/login');
        return;
      }

      const { rememberMe, loginTime } = JSON.parse(userData);
      
      // If "Remember Me" is not checked, clear after session ends
      if (!rememberMe) {
        // Check if session is still valid (e.g., 8 hours)
        const sessionDuration = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
        const currentTime = new Date().getTime();
        
        if (currentTime - loginTime > sessionDuration) {
          localStorage.removeItem('loggedInUser');
          navigate('/login');
          return;
        }
      }

      setIsAuthenticated(true);
      setLoading(false);
    };

    checkAuth();
  }, [navigate]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return isAuthenticated ? children : <UserLogin />;
};

export default AuthWrapper;