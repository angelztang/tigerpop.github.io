import React from 'react';
import { useNavigate } from 'react-router-dom';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const username = localStorage.getItem('username');

  const handleProfileClick = () => {
    navigate('/profile');
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 
              className="text-xl font-bold text-blue-600 cursor-pointer"
              onClick={() => navigate('/listings')}
            >
              TigerPop
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {username ? (
              <div 
                className="flex items-center space-x-2 cursor-pointer"
                onClick={handleProfileClick}
              >
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">
                    {username[0].toUpperCase()}
                  </span>
                </div>
                <span className="text-gray-700">{username}</span>
              </div>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 