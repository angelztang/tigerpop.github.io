import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { validateTicket, setUserInfo } from '../services/authService';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleCallback = async () => {
      const searchParams = new URLSearchParams(location.search);
      const ticket = searchParams.get('ticket');

      if (ticket) {
        try {
          console.log('Validating CAS ticket:', ticket);
          const response = await validateTicket(ticket);
          console.log('Successfully validated ticket for user:', response.netid);
          
          // Store user info and token in localStorage
          setUserInfo({ netid: response.netid });
          if (response.token) {
            localStorage.setItem('token', response.token);
          }
          
          // Force a reload to update the UI
          window.location.href = '/dashboard';
        } catch (error) {
          console.error('Error validating ticket:', error);
          // Redirect to login with error message
          navigate('/login?error=auth_failed', { replace: true });
        }
      } else {
        console.error('No ticket found in URL');
        navigate('/login?error=no_ticket', { replace: true });
      }
    };

    handleCallback();
  }, [location, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Authenticating...</h1>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
      </div>
    </div>
  );
};

export default AuthCallback; 