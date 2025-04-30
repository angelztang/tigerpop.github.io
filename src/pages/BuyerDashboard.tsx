// this should be buyer's purchase history, similar to SellerDashboard
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Listing, getBuyerListings, getHeartedListings, heartListing, unheartListing } from '../services/listingService';
import { getNetid, getUserId } from '../services/authService';
import ListingCard from '../components/ListingCard';
import ListingDetailModal from '../components/ListingDetailModal';

type FilterTab = 'all' | 'pending' | 'purchased' | 'hearted';

const BuyerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [heartedListings, setHeartedListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const currentUserId = parseInt(getUserId() || '0');

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
      console.log('Fetched hearted listings:', hearted);
      setHeartedListings(hearted);
    } catch (error) {
      console.error('Error fetching hearted listings:', error);
      setHeartedListings([]);
    }
  };

  useEffect(() => {
    fetchListings();
    fetchHeartedListings();
  }, []);

  const handleHeartClick = async (id: number) => {
    try {
      const isHearted = heartedListings.some(listing => listing.id === id);
      if (isHearted) {
        await unheartListing(id);
        // Update local state immediately for better UX
        setHeartedListings(prev => prev.filter(listing => listing.id !== id));
      } else {
        await heartListing(id);
        // Refresh hearted listings to get the updated data
        await fetchHeartedListings();
      }
    } catch (error) {
      console.error('Error toggling heart:', error);
      // Refresh hearted listings to ensure consistency
      await fetchHeartedListings();
    }
  };

  const filteredListings = listings.filter(listing => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'pending') return listing.status === 'pending';
    if (activeFilter === 'purchased') return listing.status === 'sold';
    return false;
  });

  const displayListings = activeFilter === 'hearted' ? heartedListings : filteredListings;

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">My Purchases</h1>
        
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

        {displayListings.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p className="text-xl">No items found</p>
            <p className="text-sm mt-2">
              {activeFilter === 'all' ? "You don't have any listings yet" :
               activeFilter === 'pending' ? "You don't have any pending listings" :
               activeFilter === 'purchased' ? "You haven't purchased any items yet" :
               "You haven't hearted any items yet"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayListings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                isHearted={heartedListings.some(l => l.id === listing.id)}
                onHeartClick={handleHeartClick}
                onClick={() => setSelectedListing(listing)}
                isAuction={listing.pricing_mode?.toLowerCase() === 'auction'}
              />
            ))}
          </div>
        )}

        {selectedListing && (
          <ListingDetailModal
            listing={selectedListing}
            onClose={() => setSelectedListing(null)}
            onHeartClick={() => handleHeartClick(selectedListing.id)}
            isHearted={heartedListings.some(l => l.id === selectedListing.id)}
            onHeart={() => handleHeartClick(selectedListing.id)}
            onUnheart={() => handleHeartClick(selectedListing.id)}
            onRequestToBuy={() => {
              console.log('Request to buy:', selectedListing.id);
            }}
            onPlaceBid={async (amount) => {
              try {
                console.log('Placing bid:', amount);
              } catch (error) {
                console.error('Error placing bid:', error);
              }
            }}
            currentUserId={currentUserId}
          />
        )}
      </div>
    </div>
  );
};

export default BuyerDashboard;