import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { isAuthenticated, getNetid, handleCasCallback } from './services/authService';
import Navbar from './components/Navbar';
import MarketplacePage from './pages/MarketplacePage';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import ListingDetail from './pages/ListingDetail';
import './index.css';

const App: React.FC = () => {
  const [authenticated, setAuthenticated] = useState<boolean>(isAuthenticated());
  const [netid, setNetid] = useState<string | null>(getNetid());
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Handle CAS callback if there's a token in the URL
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    
    if (token) {
      console.log('Token received from URL:', token);
      try {
        const authResponse = handleCasCallback(token);
        console.log('Auth response:', authResponse);
        setAuthenticated(true);
        setNetid(authResponse.netid);
        // Remove token from URL and redirect to dashboard
        navigate('/dashboard', { replace: true });
      } catch (error) {
        console.error('Error processing token:', error);
        setAuthenticated(false);
        setNetid(null);
      }
    }

    // Update authentication state when it changes
    const checkAuth = () => {
      const isAuth = isAuthenticated();
      const currentNetid = getNetid();
      console.log('Checking auth state:', { isAuth, currentNetid });
      setAuthenticated(isAuth);
      setNetid(currentNetid);
    };

    // Check auth state on mount and when localStorage changes
    window.addEventListener('storage', checkAuth);
    checkAuth();

    return () => {
      window.removeEventListener('storage', checkAuth);
    };
  }, [location, navigate]);

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar authenticated={authenticated} netid={netid} />
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<MarketplacePage />} />
          <Route path="/marketplace" element={<MarketplacePage />} />
          <Route 
            path="/login" 
            element={authenticated ? <Navigate to="/dashboard" /> : <LoginPage />} 
          />
          <Route 
            path="/dashboard" 
            element={authenticated ? <Dashboard /> : <Navigate to="/login" />} 
          />
          <Route path="/listings/:id" element={<ListingDetail />} />
        </Routes>
      </main>
    </div>
  );
};

export default App; 