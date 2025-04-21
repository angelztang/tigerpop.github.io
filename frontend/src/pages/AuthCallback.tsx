import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { setUserInfo } from '../services/authService';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const netid = searchParams.get('netid');

    if (netid) {
      console.log('Received netid from CAS:', netid);
      // Store netid in localStorage
      setUserInfo({ netid });
      navigate('/dashboard');
    } else {
      console.error('No netid found in URL');
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