import React, { useEffect, useState } from 'react';
import { Listing, getListings } from '../services/listingService';
import ListingCard from '../components/ListingCard';

interface PriceRange {
  label: string;
  max: number;
}

const TestMarketplace: React.FC = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPrice, setSelectedPrice] = useState<number | null>(null);
  const [heartedListings, setHeartedListings] = useState<number[]>([]);

  const priceRanges: PriceRange[] = [
    { label: 'Under $10', max: 10 },
    { label: 'Under $15', max: 15 },
    { label: 'Under $20', max: 20 },
    { label: 'Under $50', max: 50 },
  ];

  useEffect(() => {
    const fetchListings = async () => {
      try {
        console.log('TEST: Fetching listings...');
        const data = await getListings('?status=available');
        console.log('TEST: Got listings:', data);
        setListings(data);
      } catch (error) {
        console.error('TEST: Error:', error);
        setError('Failed to load listings');
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, []);

  const handlePriceClick = (max: number) => {
    setSelectedPrice(selectedPrice === max ? null : max);
  };

  const handleHeartClick = async (id: number) => {
    setHeartedListings(prev => 
      prev.includes(id) 
        ? prev.filter(listingId => listingId !== id)
        : [...prev, id]
    );
  };

  const filteredListings = listings.filter(listing => {
    if (selectedPrice && listing.price > selectedPrice) return false;
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
                  {selectedPrice
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
                    onClick={() => {}}
                    isAuction={listing.pricing_mode?.toLowerCase() === 'auction'}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestMarketplace; 