import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/authService';

const Signup: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to CAS login
    login();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Redirecting to Princeton CAS...</h1>
        <p className="text-gray-600">Please wait while we redirect you to the login page.</p>
      </div>
    </div>
  );
};

export default Signup; 