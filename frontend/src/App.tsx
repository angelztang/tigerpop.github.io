import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { isAuthenticated, getUserInfo, setUserInfo, UserInfo } from './services/authService';
import axios from 'axios';
import Navbar from './components/Navbar';
import MarketplacePage from './pages/MarketplacePage';
import TestMarketplace from './pages/TestMarketplace';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import ListingDetail from './pages/ListingDetail';
import './index.css';
import { API_URL, FRONTEND_URL } from './config';

interface AuthResponse {
  netid: string;
  token: string;
}

const App: React.FC = () => {
  const [authenticated, setAuthenticated] = useState<boolean>(false);
  const [userInfo, setUserInfoState] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      // Handle CAS callback
      if (location.pathname === '/auth/callback') {
        const ticket = new URLSearchParams(location.search).get('ticket');
        if (ticket) {
          // Validate ticket with backend, including service URL
          const serviceUrl = `${FRONTEND_URL}/auth/callback`;
          try {
            const response = await axios.get<AuthResponse>(`${API_URL}/api/auth/validate`, {
              params: {
                ticket,
                service: serviceUrl
              }
            });
            const { netid, token } = response.data;
            // Store token and netid in localStorage
            localStorage.setItem('token', token);
            localStorage.setItem('netid', netid);
            
            // Update state
            const newUserInfo: UserInfo = { netid };
            setUserInfoState(newUserInfo);
            setAuthenticated(true);
            navigate('/dashboard', { replace: true });
          } catch (error) {
            console.error('Error validating ticket:', error);
            navigate('/login?error=auth_failed', { replace: true });
          }
        }
      } else {
        // Check if user is authenticated
        const isAuth = isAuthenticated();
        if (isAuth) {
          const currentUserInfo = await getUserInfo();
          setUserInfoState(currentUserInfo);
        }
        setAuthenticated(isAuth);
      }
      setLoading(false);
    };

    checkAuth();
  }, [location, navigate]);

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar authenticated={authenticated} userInfo={userInfo} />
      <Routes>
        <Route path="/marketplace" element={<MarketplacePage />} />
        <Route path="/test-marketplace" element={<TestMarketplace />} />
        <Route path="/" element={<Navigate to="/marketplace" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/dashboard"
          element={authenticated ? <Dashboard /> : <Navigate to="/login" />}
        />
        <Route path="/listing/:id" element={<ListingDetail />} />
      </Routes>
    </div>
  );
};

export default App; 