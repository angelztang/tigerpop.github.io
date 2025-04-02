import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getUsername, logout } from '../services/authService';

interface NavbarProps {
  authenticated: boolean;
  username: string | null;
}

const Navbar: React.FC<NavbarProps> = ({ authenticated, username }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleProfileClick = () => {
    setShowProfileMenu(!showProfileMenu);
  };

  const handleLogout = () => {
    logout();
    setShowProfileMenu(false);
    navigate('/listings');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement search functionality
    console.log('Search:', searchQuery);
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex flex-col py-4">
          {/* Top bar with logo and profile */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              <h1 
                className="text-2xl font-bold cursor-pointer"
                onClick={() => navigate('/listings')}
              >
                <span className="text-orange-500">Tiger</span>
                <span>Pop</span>
              </h1>
            </div>
            
            <div className="flex items-center space-x-6">
              <Link to="/listings" className="text-gray-600 hover:text-gray-900">home</Link>
              <Link to="/listings" className="text-orange-500 hover:text-orange-600">buy</Link>
              <Link to="/dashboard" className="text-gray-600 hover:text-gray-900">sell</Link>
              {authenticated ? (
                <div className="relative">
                  <div 
                    className="flex items-center space-x-2 cursor-pointer hover:text-orange-500"
                    onClick={handleProfileClick}
                  >
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <span className="text-orange-600 font-semibold">
                        {username?.[0].toUpperCase()}
                      </span>
                    </div>
                    <span className="text-gray-700">{username}</span>
                  </div>
                  
                  {/* Profile Dropdown Menu */}
                  {showProfileMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-gray-700 hover:bg-orange-50"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        My Profile
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-orange-50"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => navigate('/login')}
                  className="text-gray-600 hover:text-gray-900"
                >
                  Login
                </button>
              )}
            </div>
          </div>

          {/* Categories and search bar */}
          <div className="flex flex-col space-y-4">
            <div className="flex space-x-6">
              <Link to="/listings?category=men" className="text-gray-600 hover:text-gray-900">men</Link>
              <Link to="/listings?category=women" className="text-gray-600 hover:text-gray-900">women</Link>
              <Link to="/listings?category=textbooks" className="text-gray-600 hover:text-gray-900">textbooks</Link>
              <Link to="/listings?category=furniture" className="text-gray-600 hover:text-gray-900">furniture</Link>
              <Link to="/listings?category=other" className="text-gray-600 hover:text-gray-900">other</Link>
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