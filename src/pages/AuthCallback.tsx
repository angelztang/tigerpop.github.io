import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { API_URL, FRONTEND_URL } from '../config';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const ticket = params.get('ticket');
    
    if (ticket) {
      // Validate ticket with backend, including service URL
      const serviceUrl = `${FRONTEND_URL}/auth/callback`;
      axios.get(`${API_URL}/api/auth/validate`, {
        params: {
          ticket,
          service: serviceUrl
        }
      })
        .then(response => {
          const { netid, token } = response.data;
          // Store token and netid in localStorage
          localStorage.setItem('token', token);
          localStorage.setItem('netid', netid);
          
          // Redirect to dashboard
          navigate('/dashboard');
        })
        .catch(error => {
          console.error('Error validating ticket:', error);
          navigate('/login?error=invalid_ticket');
        });
    } else {
      navigate('/login?error=no_ticket');
    }
  }, [navigate, location]);

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Authenticating...</p>
      </div>
    </div>
  );
};

export default AuthCallback; 