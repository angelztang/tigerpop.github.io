import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getNetid, logout, UserInfo } from '../services/authService';

interface NavbarProps {
  authenticated: boolean;
  userInfo: UserInfo | null;
}

const Navbar: React.FC<NavbarProps> = ({ authenticated, userInfo }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleProfileClick = () => {
    setShowProfileMenu(!showProfileMenu);
  };

  const handleLogout = () => {
    logout();
    setShowProfileMenu(false);
    // Force a page reload to ensure all state is cleared
    window.location.reload();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery) {
      navigate(`/marketplace?search=${encodeURIComponent(trimmedQuery)}`);
      // Clear the search input after navigation
      setSearchQuery('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent form submission
      handleSearch(e);
    }
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
                onClick={() => navigate('/marketplace')}
              >
                <span className="text-orange-500">Tiger</span>
                <span>Pop</span>
              </h1>
            </div>
            
            <div className="flex items-center space-x-6">
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
                        {userInfo?.netid?.[0].toUpperCase()}
                      </span>
                    </div>
                    <span className="text-gray-700">{userInfo?.netid}</span>
                  </div>
                  
                  {/* Profile Dropdown Menu */}
                  {showProfileMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
                      <Link
                        to="/dashboard/buyer"
                        className="block px-4 py-2 text-gray-700 hover:bg-orange-50"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        Buyer Dashboard
                      </Link>
                      <Link
                        to="/dashboard/seller"
                        className="block px-4 py-2 text-gray-700 hover:bg-orange-50"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        Seller Dashboard
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
            </div>
          </div>

          {/* Categories and search bar */}
          <div className="flex flex-col space-y-4">
            <div className="flex space-x-6">
              <Link to="/marketplace?category=tops" className="text-gray-600 hover:text-gray-900">Tops</Link>
              <Link to="/marketplace?category=bottoms" className="text-gray-600 hover:text-gray-900">Bottoms</Link>
              <Link to="/marketplace?category=dresses" className="text-gray-600 hover:text-gray-900">Dresses</Link>
              <Link to="/marketplace?category=shoes" className="text-gray-600 hover:text-gray-900">Shoes</Link>
              <Link to="/marketplace?category=furniture" className="text-gray-600 hover:text-gray-900">Furniture</Link>
              <Link to="/marketplace?category=appliances" className="text-gray-600 hover:text-gray-900">Appliances</Link>
              <Link to="/marketplace?category=books" className="text-gray-600 hover:text-gray-900">Books</Link>
              <Link to="/marketplace?category=other" className="text-gray-600 hover:text-gray-900">Other</Link>
            </div>
            
            <form onSubmit={handleSearch} className="flex space-x-2">
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full px-4 py-2 rounded-lg bg-orange-100 bg-opacity-30 focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-300"
              >
                Search
              </button>
            </form>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 