// this should be buyer's purchase history, similar to SellerDashboard
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Listing, getBuyerListings } from '../services/listingService';
import { getUserId } from '../services/authService';
import ListingCard from '../components/ListingCard';
import ListingDetailModal from '../components/ListingDetailModal';

type FilterTab = 'all' | 'pending' | 'purchased';

const BuyerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      const userId = getUserId();
      if (!userId) {
        console.error('No user ID found');
        setError('User not authenticated');
        return;
      }
      console.log('Fetching listings for user:', userId);
      const data = await getBuyerListings(userId);
      console.log('Received listings:', data);
      setListings(data);
    } catch (err) {
      console.error('Detailed error in fetchListings:', err);
      setError('Failed to load listings. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const filteredListings = listings.filter(listing => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'pending') return listing.status === 'pending';
    if (activeFilter === 'purchased') return listing.status === 'sold';
    return true;
  });

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">My Purchases</h1>

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <div className="mb-6">
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-4 py-2 rounded-md ${
                activeFilter === 'all'
                  ? 'bg-orange-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveFilter('pending')}
              className={`px-4 py-2 rounded-md ${
                activeFilter === 'pending'
                  ? 'bg-orange-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setActiveFilter('purchased')}
              className={`px-4 py-2 rounded-md ${
                activeFilter === 'purchased'
                  ? 'bg-orange-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Purchased
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.length > 0 ? (
            filteredListings.map(listing => (
              <ListingCard
                key={listing.id}
                listing={listing}
                onDelete={() => {}}
                onClick={() => setSelectedListing(listing)}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-xl text-gray-600">
                {activeFilter === 'all'
                  ? "You haven't made any purchases yet"
                  : activeFilter === 'pending'
                  ? "You don't have any pending purchases"
                  : "You haven't completed any purchases yet"}
              </p>
            </div>
          )}
        </div>

        {selectedListing && (
          <ListingDetailModal
            listing={selectedListing}
            onClose={() => setSelectedListing(null)}
          />
        )}
      </div>
    </div>
  );
};

export default BuyerDashboard;