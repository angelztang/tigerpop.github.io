import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ListingsPage from './pages/ListingsPage';
import Dashboard from './pages/Dashboard';
import SellerDashboard from './pages/SellerDashboard';
import { isAuthenticated } from './services/authService';

const PrivateRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => {
  return isAuthenticated() ? element : <Navigate to="/login" />;
};

const App: React.FC = () => {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<ListingsPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route
          path="/seller"
          element={<PrivateRoute element={<SellerDashboard />} />}
        />
      </Routes>
    </div>
  );
};

export default App; 