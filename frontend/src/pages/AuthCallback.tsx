import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

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
      // Use the backend URL as the service URL for CAS validation
      const serviceUrl = `${process.env.REACT_APP_API_URL}/api/auth/cas/callback`;
      const encodedServiceUrl = encodeURIComponent(serviceUrl);
      
      axios.get<AuthResponse>(`${process.env.REACT_APP_API_URL}/api/auth/validate?ticket=${ticket}&service=${encodedServiceUrl}`, {
        withCredentials: true
      })
        .then(response => {
          const { netid } = response.data;
          // Store netid in localStorage
          localStorage.setItem('netid', netid);
          navigate('/dashboard');
        })
        .catch(error => {
          console.error('Error validating CAS ticket:', error);
          navigate('/login');
        });
    } else {
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