import React, { useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import MarketplacePage from './pages/MarketplacePage';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import { handleCasCallback } from './services/authService';

const App: React.FC = () => {
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
  }, [location, navigate]);

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<MarketplacePage />} />
          <Route path="/marketplace" element={<MarketplacePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </main>
    </div>
  );
};

export default App; 