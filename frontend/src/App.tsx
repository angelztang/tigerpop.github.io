import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { isAuthenticated, getNetid } from './services/authService';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import ListingDetail from './pages/ListingDetail';
import CreateListing from './pages/CreateListing';
import './index.css';

const App: React.FC = () => {
  const [authenticated, setAuthenticated] = useState<boolean>(isAuthenticated());
  const [netid, setNetid] = useState<string | null>(getNetid());

  useEffect(() => {
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
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar authenticated={authenticated} netid={netid} />
      <div className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route 
            path="/login" 
            element={authenticated ? <Navigate to="/" /> : <Login />} 
          />
          <Route path="/listings/:id" element={<ListingDetail />} />
          <Route 
            path="/create-listing" 
            element={authenticated ? <CreateListing /> : <Navigate to="/login" />} 
          />
        </Routes>
      </div>
    </div>
  );
};

export default App; 