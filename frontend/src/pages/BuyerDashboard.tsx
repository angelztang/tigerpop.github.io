// this should be buyer's purchase history, similar to SellerDashboard
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Listing, getBuyerListings, getHeartedListings, heartListing, unheartListing } from '../services/listingService';
import { getNetid } from '../services/authService';
import ListingCard from '../components/ListingCard';
import ListingDetailModal from '../components/ListingDetailModal';

type FilterTab = 'all' | 'pending' | 'purchased' | 'hearted';

const BuyerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [heartedListings, setHeartedListings] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);

  const fetchListings = async () => {
    try {
      const netid = getNetid();
      if (!netid) {
        setError('User not authenticated');
        setLoading(false);
        return;
      }
      const data = await getBuyerListings(netid);
      setListings(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch listings');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHeartedListings = async () => {
    try {
      const hearted = await getHeartedListings();
      setHeartedListings(hearted.map(listing => listing.id));
    } catch (error) {
      console.error('Error fetching hearted listings:', error);
    }
  };

  useEffect(() => {
    fetchListings();
    fetchHeartedListings();
  }, []);

  const handleHeartClick = async (id: number) => {
    try {
      if (heartedListings.includes(id)) {
        await unheartListing(id);
        setHeartedListings(heartedListings.filter(listingId => listingId !== id));
      } else {
        await heartListing(id);
        setHeartedListings([...heartedListings, id]);
      }
      // If we're on the hearted filter, refresh the listings
      if (activeFilter === 'hearted') {
        await fetchListings();
      }
    } catch (error) {
      console.error('Error toggling heart:', error);
    }
  };

  const filteredListings = listings.filter(listing => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'pending') return listing.status === 'pending';
    if (activeFilter === 'purchased') return listing.status === 'sold';
    if (activeFilter === 'hearted') return heartedListings.includes(listing.id);
    return false;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">Loading listings...</div>
      </div>
    );
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

        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveFilter('all')}
              className={`${
                activeFilter === 'all'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              All ({listings.length})
            </button>
            <button
              onClick={() => setActiveFilter('pending')}
              className={`${
                activeFilter === 'pending'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Pending ({listings.filter(l => l.status === 'pending').length})
            </button>
            <button
              onClick={() => setActiveFilter('purchased')}
              className={`${
                activeFilter === 'purchased'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Purchased ({listings.filter(l => l.status === 'sold').length})
            </button>
            <button
              onClick={() => setActiveFilter('hearted')}
              className={`${
                activeFilter === 'hearted'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Hearted ({heartedListings.length})
            </button>
          </nav>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.length > 0 ? (
            filteredListings.map(listing => (
              <ListingCard
                key={listing.id}
                listing={listing}
                isHearted={heartedListings.includes(listing.id)}
                onHeartClick={() => handleHeartClick(listing.id)}
                onClick={() => setSelectedListing(listing)}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-xl text-gray-600">
                {activeFilter === 'all' 
                  ? "You don't have any listings yet"
                  : activeFilter === 'pending'
                  ? "You don't have any pending listings"
                  : activeFilter === 'purchased'
                  ? "You haven't purchased any items yet"
                  : "You haven't hearted any items yet"}
              </p>
            </div>
          )}
        </div>

        {selectedListing && (
          <ListingDetailModal
            listing={selectedListing}
            isHearted={heartedListings.includes(selectedListing.id)}
            onHeartClick={() => handleHeartClick(selectedListing.id)}
            onClose={() => setSelectedListing(null)}
            onUpdate={fetchListings}
          />
        )}
      </div>
    </div>
  );
};

export default BuyerDashboard;