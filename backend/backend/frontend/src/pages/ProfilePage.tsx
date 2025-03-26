import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ListingForm from '../components/ListingForm';
import { getUserListings } from '../services/listingService';
import { Listing } from '../services/listingService';
import ListingCard from '../components/ListingCard';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [username, setUsername] = useState<string>('');

  useEffect(() => {
    // Get username from localStorage
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
      setUsername(storedUsername);
    }
    fetchUserListings();
  }, []);

  const fetchUserListings = async () => {
    try {
      const data = await getUserListings();
      setListings(data);
    } catch (error) {
      console.error('Error fetching user listings:', error);
    }
  };

  const handleFormClose = () => {
    setShowCreateForm(false);
    fetchUserListings(); // Refresh listings after form is closed
  };

  const handleCreateListing = () => {
    setShowCreateForm(true);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Profile</h1>
        <button
          onClick={() => navigate('/listings')}
          className="text-blue-500 hover:text-blue-600"
        >
          Back to Listings
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center space-x-4">
          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-2xl text-gray-600">
              {username ? username[0].toUpperCase() : '?'}
            </span>
          </div>
          <div>
            <h2 className="text-xl font-semibold">{username}</h2>
            <p className="text-gray-600">Member since 2024</p>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold">My Listings</h2>
        <button
          onClick={handleCreateListing}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Create New Listing
        </button>
      </div>

      {showCreateForm && (
        <div className="mb-8">
          <ListingForm onClose={handleFormClose} />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {listings.map((listing) => (
          <ListingCard key={listing.id} item={listing} />
        ))}
      </div>
    </div>
  );
};

export default ProfilePage; 