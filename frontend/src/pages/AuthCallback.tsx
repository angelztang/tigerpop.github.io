import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { setNetid } from '../services/authService';
import axios from 'axios';

interface ValidationResponse {
  netid: string;
}

const AuthCallback: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    const validateTicket = async () => {
      const searchParams = new URLSearchParams(location.search);
      const ticket = searchParams.get('ticket');

      if (!ticket) {
        window.location.href = '/login?error=no_ticket';
        return;
      }

      try {
        // Send ticket to backend for validation
        const response = await axios.get<ValidationResponse>('/api/auth/validate', {
          params: {
            ticket,
            service: window.location.origin + '/auth/callback'
          }
        });

        // Store netid and redirect to dashboard
        setNetid(response.data.netid);
        window.location.href = '/dashboard';
      } catch (error) {
        console.error('Failed to validate ticket:', error);
        window.location.href = '/login?error=validation_failed';
      }
    };

    validateTicket();
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