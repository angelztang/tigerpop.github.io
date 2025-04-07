import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CAS_URL, CAS_SERVICE } from '../config';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement search functionality
    console.log('Search:', searchQuery);
  };

  const handleLogin = () => {
    // Log the URLs for debugging
    console.log('CAS URL:', CAS_URL);
    console.log('Service URL:', CAS_SERVICE);
    
    // Redirect to CAS login with the service URL
    window.location.href = `${CAS_URL}/login?service=${encodeURIComponent(CAS_SERVICE)}`;
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex flex-col py-4">
          {/* Top bar with logo */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              <h1 
                className="text-2xl font-bold cursor-pointer"
                onClick={() => navigate('/marketplace')}
              >
                <span className="text-orange-500">Tiger</span>
                <span>Pop</span>
              </h1>
            </div>
            
            <div className="flex items-center space-x-6">
              <Link to="/dashboard" className="text-gray-600 hover:text-gray-900">home</Link>
              <Link to="/marketplace" className="text-orange-500 hover:text-orange-600">buy</Link>
              <button
                onClick={handleLogin}
                className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 transition-colors"
              >
                Login
              </button>
            </div>
          </div>

          {/* Categories and search bar */}
          <div className="flex flex-col space-y-4">
            <div className="flex space-x-6">
              <Link to="/marketplace?category=men" className="text-gray-600 hover:text-gray-900">men</Link>
              <Link to="/marketplace?category=women" className="text-gray-600 hover:text-gray-900">women</Link>
              <Link to="/marketplace?category=textbooks" className="text-gray-600 hover:text-gray-900">textbooks</Link>
              <Link to="/marketplace?category=furniture" className="text-gray-600 hover:text-gray-900">furniture</Link>
              <Link to="/marketplace?category=other" className="text-gray-600 hover:text-gray-900">other</Link>
            </div>
            
            <form onSubmit={handleSearch} className="flex">
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-orange-100 bg-opacity-30 focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </form>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 