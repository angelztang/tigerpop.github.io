import React, { useEffect, useState } from 'react';
import ListingCard from '../components/ListingCard';
import ListingDetailModal from '../components/ListingDetailModal';
import { Listing, getListings, heartListing, unheartListing, getHeartedListings } from '../services/listingService';
import { useSearchParams, useNavigate } from 'react-router-dom';

interface PriceRange {
  label: string;
  max: number;
}

const MarketplacePage: React.FC = () => {
  console.log('MarketplacePage component mounted');
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPrice, setSelectedPrice] = useState<number | null>(null);
  const [heartedListings, setHeartedListings] = useState<number[]>([]);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const searchQuery = searchParams.get('search')?.toLowerCase() || '';

  // Clear search parameter from URL on mount
  useEffect(() => {
    if (searchQuery) {
      searchParams.delete('search');
      setSearchParams(searchParams);
    }
  }, []);

  const priceRanges: PriceRange[] = [
    { label: 'Under $10', max: 10 },
    { label: 'Under $15', max: 15 },
    { label: 'Under $20', max: 20 },
    { label: 'Under $50', max: 50 },
  ];

  useEffect(() => {
    const fetchListings = async () => {
      try {
        console.log('Fetching listings...');
        const data = await getListings('?status=available');
        console.log('Received listings:', data);
        setListings(data);
      } catch (error) {
        console.error('Error fetching listings:', error);
        setError('Failed to load listings');
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

    fetchListings();
    fetchHeartedListings();
  }, []);

  const handlePriceClick = (max: number) => {
    setSelectedPrice(selectedPrice === max ? null : max);
  };

  const handleListingClick = (listing: Listing) => {
    setSelectedListing(listing);
  };

  const handleHeartClick = async (id: number) => {
    try {
      const isHearted = heartedListings.includes(id);
      if (isHearted) {
        await unheartListing(id);
        setHeartedListings(prev => prev.filter(listingId => listingId !== id));
        // Update the listings to reflect the new hearts count
        setListings(prev => prev.map(listing => 
          listing.id === id 
            ? { ...listing, hearts_count: (listing.hearts_count || 0) - 1 }
            : listing
        ));
      } else {
        await heartListing(id);
        setHeartedListings(prev => [...prev, id]);
        // Update the listings to reflect the new hearts count
        setListings(prev => prev.map(listing => 
          listing.id === id 
            ? { ...listing, hearts_count: (listing.hearts_count || 0) + 1 }
            : listing
        ));
      }
    } catch (error) {
      console.error('Error toggling heart:', error);
      // Refresh hearted listings to ensure consistency
      const hearted = await getHeartedListings();
      setHeartedListings(hearted.map(listing => listing.id));
    }
  };

  // Function to determine if a listing is "hot" (top 4 most hearted listings)
  const isHotItem = (listing: Listing) => {
    // Sort listings by hearts count in descending order
    const sortedByHearts = [...listings].sort((a, b) => (b.hearts_count || 0) - (a.hearts_count || 0));
    // Get the top 4 listings
    const topFourListings = sortedByHearts.slice(0, 4);
    // Check if the current listing is in the top 4
    return topFourListings.some(topListing => topListing.id === listing.id);
  };

  const filteredListings = listings.filter(listing => {
    // Apply price filter
    if (selectedPrice && listing.price > selectedPrice) return false;
    
    // Apply search filter
    if (searchQuery) {
      const matchesSearch = 
        listing.title.toLowerCase().includes(searchQuery) ||
        listing.description.toLowerCase().includes(searchQuery) ||
        listing.category.toLowerCase().includes(searchQuery);
      if (!matchesSearch) return false;
    }
    
    return true;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col space-y-8">
          {/* Search Results Header */}
          {searchQuery && (
            <div className="text-xl font-bold">
              Search results for "{searchQuery}"
            </div>
          )}

          {/* Price Filters */}
          <div>
            <h2 className="text-xl font-bold mb-4">Price Range</h2>
            <div className="flex flex-wrap gap-4">
              {priceRanges.map((range) => (
                <button
                  key={range.max}
                  onClick={() => handlePriceClick(range.max)}
                  className={`px-4 py-2 rounded-lg ${
                    selectedPrice === range.max
                      ? 'bg-orange-500 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

          {/* Listings Grid */}
          <div>
            <h2 className="text-xl font-bold mb-6">
              {selectedPrice 
                ? `Items under $${selectedPrice}`
                : 'All Items'}
            </h2>
            {filteredListings.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-xl text-gray-600">
                  {searchQuery
                    ? `No items found matching "${searchQuery}"`
                    : selectedPrice
                    ? `No items found under $${selectedPrice}`
                    : 'No items available in the marketplace yet'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredListings.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    isHearted={heartedListings.includes(listing.id)}
                    onHeartClick={() => handleHeartClick(listing.id)}
                    onClick={() => handleListingClick(listing)}
                    isHot={isHotItem(listing)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Listing Detail Modal */}
      {selectedListing && (
        <ListingDetailModal
          listing={selectedListing}
          isHearted={heartedListings.includes(selectedListing.id)}
          onHeartClick={() => handleHeartClick(selectedListing.id)}
          onClose={() => setSelectedListing(null)}
        />
      )}
    </div>
  );
};

export default MarketplacePage; 