<<<<<<< HEAD
import React, { useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import MarketplacePage from './pages/MarketplacePage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import Dashboard from './pages/Dashboard';
import { handleCasCallback } from './services/authService';

const App: React.FC = () => {
=======
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
>>>>>>> c4d72ccc050220ad09ebb324fa9247b67b9a7908
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Handle CAS callback if there's a token in the URL
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    
    if (token) {
      handleCasCallback(token);
      // Remove token from URL and redirect to dashboard
      navigate('/dashboard', { replace: true });
    }
<<<<<<< HEAD
=======

    // Update authentication state when it changes
    const checkAuth = () => {
      setAuthenticated(isAuthenticated());
      setNetid(getNetid());
    };

    // Check auth state on mount and when localStorage changes
    window.addEventListener('storage', checkAuth);
    checkAuth();

    return () => {
      window.removeEventListener('storage', checkAuth);
    };
>>>>>>> c4d72ccc050220ad09ebb324fa9247b67b9a7908
  }, [location, navigate]);

  return (
    <div className="min-h-screen bg-gray-100">
<<<<<<< HEAD
      <Navbar />
=======
      <Navbar authenticated={authenticated} netid={netid} />
>>>>>>> c4d72ccc050220ad09ebb324fa9247b67b9a7908
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<MarketplacePage />} />
          <Route path="/marketplace" element={<MarketplacePage />} />
<<<<<<< HEAD
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
=======
          <Route 
            path="/login" 
            element={authenticated ? <Navigate to="/dashboard" /> : <LoginPage />} 
          />
          <Route 
            path="/dashboard" 
            element={authenticated ? <Dashboard /> : <Navigate to="/login" />} 
          />
          <Route path="/listings/:id" element={<ListingDetail />} />
>>>>>>> c4d72ccc050220ad09ebb324fa9247b67b9a7908
        </Routes>
      </main>
    </div>
  );
};

export default App; 