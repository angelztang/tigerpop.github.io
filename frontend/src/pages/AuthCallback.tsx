import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { FRONTEND_URL, API_URL } from '../config';

interface AuthResponse {
  netid: string;
}

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const ticket = searchParams.get('ticket');

    if (ticket) {
      // Use the frontend URL as the service URL for CAS validation
      const serviceUrl = `${FRONTEND_URL}/auth/callback`;
      const encodedServiceUrl = encodeURIComponent(serviceUrl);
      
      console.log('Validating CAS ticket with service URL:', serviceUrl);
      
      axios.get<AuthResponse>(`${API_URL}/api/auth/validate?ticket=${ticket}&service=${encodedServiceUrl}`, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }
      })
        .then(response => {
          const { netid } = response.data;
          console.log('CAS validation successful, netid:', netid);
          // Store netid in localStorage
          localStorage.setItem('netid', netid);
          navigate('/dashboard');
        })
        .catch(error => {
          console.error('Error validating CAS ticket:', error);
          // Clear any existing netid on error
          localStorage.removeItem('netid');
          navigate('/login');
        });
    } else {
      console.error('No ticket found in URL');
      localStorage.removeItem('netid');
      navigate('/login');
    }
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