import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
<<<<<<< HEAD
import { CAS_URL, CAS_SERVICE } from '../config';
=======
import { getNetid, logout } from '../services/authService';
>>>>>>> c4d72ccc050220ad09ebb324fa9247b67b9a7908

interface NavbarProps {
  authenticated: boolean;
  netid: string | null;
}

const Navbar: React.FC<NavbarProps> = ({ authenticated, netid }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);

<<<<<<< HEAD
=======
  const handleProfileClick = () => {
    setShowProfileMenu(!showProfileMenu);
  };

  const handleLogout = () => {
    logout();
    setShowProfileMenu(false);
    // Force a page reload to ensure all state is cleared
    window.location.reload();
  };

>>>>>>> c4d72ccc050220ad09ebb324fa9247b67b9a7908
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
<<<<<<< HEAD
              <Link to="/dashboard" className="text-gray-600 hover:text-gray-900">home</Link>
              <Link to="/marketplace" className="text-orange-500 hover:text-orange-600">buy</Link>
              <button
                onClick={handleLogin}
                className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 transition-colors"
              >
                Login
              </button>
=======
              {/* <Link to="/listings" className="text-gray-600 hover:text-gray-900">home</Link>
              <Link to="/listings" className="text-orange-500 hover:text-orange-600">buy</Link>
              <Link to="/dashboard" className="text-gray-600 hover:text-gray-900">sell</Link> */}
              {authenticated ? (
                <div className="relative">
                  <div 
                    className="flex items-center space-x-2 cursor-pointer hover:text-orange-500"
                    onClick={handleProfileClick}
                  >
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <span className="text-orange-600 font-semibold">
                        {netid?.[0].toUpperCase()}
                      </span>
                    </div>
                    <span className="text-gray-700">{netid}</span>
                  </div>
                  
                  {/* Profile Dropdown Menu */}
                  {showProfileMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
                      <Link
                        to="/dashboard"
                        className="block px-4 py-2 text-gray-700 hover:bg-orange-50"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        My Dashboard
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
                <Link
                  to="/login"
                  className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
                >
                  Login
                </Link>
              )}
>>>>>>> c4d72ccc050220ad09ebb324fa9247b67b9a7908
            </div>
          </div>

          {/* Categories and search bar */}
          <div className="flex flex-col space-y-4">
            <div className="flex space-x-6">
              <Link to="/marketplace?category=men" className="text-gray-600 hover:text-gray-900">men</Link>
              <Link to="/marketplace?category=women" className="text-gray-600 hover:text-gray-900">women</Link>
<<<<<<< HEAD
              <Link to="/marketplace?category=textbooks" className="text-gray-600 hover:text-gray-900">textbooks</Link>
=======
>>>>>>> c4d72ccc050220ad09ebb324fa9247b67b9a7908
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