import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { validateTicket, setUserInfo } from '../services/authService';

const AuthCallback: React.FC = () => {
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
          
          // Store user info in localStorage
          setUserInfo({ netid: response.netid });
          
          // Force a full page reload to update the UI state
          window.location.href = '/dashboard';
        } catch (error) {
          console.error('Error validating ticket:', error);
          // Redirect to login with error message
          window.location.href = '/login?error=auth_failed';
        }
      } else {
        console.error('No ticket found in URL');
        window.location.href = '/login?error=no_ticket';
      }
    };

    handleCallback();
  }, [location]);

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