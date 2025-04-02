// Angel
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ListingForm from '../components/ListingForm';
import { getUserListings, Listing } from '../services/listingService';
import ListingCard from '../components/ListingCard';
import { getUsername, getUserId } from '../services/authService';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [username, setUsername] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalListings: 0,
    activeListings: 0,
    totalViews: 0
  });

  useEffect(() => {
    // Get user info from localStorage
    const storedUsername = getUsername();
    const storedUserId = getUserId();
    if (storedUsername) {
      setUsername(storedUsername);
    }
    if (storedUserId) {
      setUserId(storedUserId);
    }
    fetchUserListings();
  }, []);

  useEffect(() => {
    // Update stats when listings change
    setStats({
      totalListings: listings.length,
      activeListings: listings.filter(l => l.status === 'active').length,
      totalViews: listings.reduce((sum, l) => sum + (l.views || 0), 0)
    });
  }, [listings]);

  const fetchUserListings = async () => {
    try {
      setLoading(true);
      const data = await getUserListings();
      setListings(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch your listings');
      console.error('Error fetching user listings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFormClose = () => {
    setShowCreateForm(false);
    fetchUserListings(); // Refresh listings after form is closed
  };

  const handleCreateListing = () => {
    setShowCreateForm(true);
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (error) {
    return <div className="text-center py-12 text-red-600">{error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <button
          onClick={() => navigate('/listings')}
          className="text-orange-500 hover:text-orange-600 font-medium"
        >
          Back to Listings
        </button>
      </div>

      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center space-x-6">
          <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center">
            <span className="text-3xl text-orange-600 font-bold">
              {username ? username[0].toUpperCase() : '?'}
            </span>
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-semibold text-gray-900">{username}</h2>
            <p className="text-gray-600">Princeton Student</p>
            <p className="text-sm text-gray-500">User ID: {userId}</p>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Listings</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.totalListings}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Active Listings</h3>
          <p className="text-3xl font-bold text-green-600">{stats.activeListings}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Views</h3>
          <p className="text-3xl font-bold text-purple-600">{stats.totalViews}</p>
        </div>
      </div>

      {/* Listings Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">My Listings</h2>
          <button
            onClick={handleCreateListing}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
          >
            Create New Listing
          </button>
        </div>

        {showCreateForm && (
          <div className="mb-8">
            <ListingForm onClose={handleFormClose} />
          </div>
        )}

        {listings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">You haven't posted any listings yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage; 