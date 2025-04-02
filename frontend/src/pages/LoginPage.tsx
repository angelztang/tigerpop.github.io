// Angel
import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { login, handleCasCallback } from '../services/authService';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check for token in URL (CAS callback)
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    
    if (token) {
      handleCasCallback(token);
      // Get the intended destination from state or default to listings
      const from = (location.state as any)?.from?.pathname || '/listings';
      navigate(from, { replace: true });
    } else {
      // If no token, redirect to CAS login
      login();
    }
  }, [location, navigate]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          <span className="text-orange-500">Tiger</span>
          <span>Pop</span>
        </h2>
        <h3 className="mt-2 text-center text-xl text-gray-600">
          Redirecting to Princeton CAS...
        </h3>
      </div>
    </div>
  );
};

export default LoginPage; 