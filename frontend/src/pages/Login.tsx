import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, handleCasCallback } from '../services/authService';

const Login: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we have a token in the URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
      // Handle the CAS callback with token
      try {
        handleCasCallback(token);
        // Clear the URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
        // Trigger storage event for App component to detect
        window.dispatchEvent(new Event('storage'));
        // Redirect to home page
        navigate('/');
        return;
      } catch (error) {
        console.error('Error handling CAS callback:', error);
        // If there's an error, redirect to login page
        navigate('/login');
        return;
      }
    }

    // Check if we have an error parameter
    const error = urlParams.get('error');
    if (error) {
      console.error('Login error:', error);
      // You might want to show an error message to the user here
      return;
    }

    // If no token and no error, proceed with CAS login
    login();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Redirecting to Princeton CAS...</h2>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
      </div>
    </div>
  );
};

export default Login; 