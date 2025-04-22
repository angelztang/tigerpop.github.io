import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { validateTicket, setNetid } from '../services/authService';
import { API_URL } from '../config';

const AuthCallback: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    const handleCallback = async () => {
      const searchParams = new URLSearchParams(location.search);
      const ticket = searchParams.get('ticket');

      if (!ticket) {
        console.error('No ticket found in URL');
        window.location.href = '/login?error=no_ticket';
        return;
      }

      try {
        console.log('Validating ticket:', ticket);
        const serviceUrl = `${window.location.origin}/auth/callback`;
        console.log('Service URL:', serviceUrl);
        
        const userInfo = await validateTicket(ticket);
        console.log('Validation successful:', userInfo);
        
        // Store netid and redirect to dashboard
        setNetid(userInfo.netid);
        console.log('Stored netid:', userInfo.netid);
        
        window.location.href = '/dashboard';
      } catch (error) {
        console.error('Failed to validate ticket:', error);
        window.location.href = '/login?error=validation_failed';
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