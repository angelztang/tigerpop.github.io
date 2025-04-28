import React, { useEffect, useState } from 'react';
import ListingCard from '../components/ListingCard';
import ListingDetailModal from '../components/ListingDetailModal';
import { Listing, getListings, heartListing, unheartListing, getHeartedListings, placeBid, getHotItems } from '../services/listingService';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getUserId } from '../services/authService';

interface PriceRange {
  label: string;
  max: number;
}

const conditions = [
  'New',
  'Like New',
  'Good',
  'Fair',
  'Used'
];

const priceRanges: PriceRange[] = [
  { label: 'Any Price', max: 0 },
  { label: 'Under $10', max: 10 },
  { label: 'Under $15', max: 15 },
  { label: 'Under $20', max: 20 },
  { label: 'Under $50', max: 50 },
  { label: 'Under $100', max: 100 }
];

const MarketplacePage: React.FC = () => {
  console.log('MarketplacePage component mounted');
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPrice, setSelectedPrice] = useState<number>(0);
  const [selectedCondition, setSelectedCondition] = useState<string>('');
  const [selectedAuctionFilter, setSelectedAuctionFilter] = useState<string>('all'); // 'all', 'auction', 'fixed'
  const [heartedListings, setHeartedListings] = useState<number[]>([]);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [hotItems, setHotItems] = useState<Set<number>>(new Set());
  const [showHotOnly, setShowHotOnly] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const searchQuery = searchParams.get('search')?.toLowerCase() || '';
  const category = searchParams.get('category') || '';
  const currentUserId = parseInt(getUserId() || '0');

  // Add event listener for clearFilters event
  useEffect(() => {
    const handleClearFilters = () => {
      clearFilters();
    };

    window.addEventListener('clearFilters', handleClearFilters);
    return () => {
      window.removeEventListener('clearFilters', handleClearFilters);
    };
  }, []);

  const clearFilters = () => {
    setSelectedPrice(0);
    setSelectedCondition('');
    setSelectedAuctionFilter('all');
    setShowHotOnly(false);
    // Clear search and category from URL
    const newParams = new URLSearchParams();
    setSearchParams(newParams);
  };

  // Clear search parameter from URL on mount
  useEffect(() => {
    if (searchQuery) {
      searchParams.delete('search');
      setSearchParams(searchParams);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching listings...');
        // Include category in the API request if it exists
        const categoryParam = category ? `&category=${category}` : '';
        
        // Always fetch listings and hot items
        const [listingsData, hotItemsData] = await Promise.all([
          getListings(`?status=available${categoryParam}`),
          getHotItems()
        ]);
        
        // Only fetch hearted listings if user is logged in
        if (currentUserId) {
          try {
            const heartedData = await getHeartedListings();
            setHeartedListings(heartedData.map(listing => listing.id));
          } catch (error) {
            console.error('Error fetching hearted listings:', error);
            setHeartedListings([]);
          }
        } else {
          setHeartedListings([]);
        }
        
        console.log('Received listings:', listingsData);
        setListings(listingsData);
        setHotItems(new Set(hotItemsData.map(listing => listing.id)));
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load listings');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [category, currentUserId]);

  const handlePriceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPrice(Number(e.target.value));
    setShowHotOnly(false);
  };

  const handleConditionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCondition(e.target.value);
    setShowHotOnly(false);
  };

  const handleAuctionFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedAuctionFilter(e.target.value);
    setShowHotOnly(false);
  };

  const handleHotItemsClick = () => {
    setShowHotOnly(!showHotOnly);
    setSelectedPrice(0);
    setSelectedCondition('');
  };

  const handleListingClick = (listing: Listing) => {
    setSelectedListing(listing);
  };

  const handleHeartClick = async (id: number) => {
    if (!currentUserId) {
      // Optionally show a message or redirect to login
      console.log('Please log in to heart listings');
      return;
    }
    
    try {
      const isHearted = heartedListings.includes(id);
      if (isHearted) {
        await unheartListing(id);
        setHeartedListings(prev => prev.filter(listingId => listingId !== id));
      } else {
        await heartListing(id);
        setHeartedListings(prev => [...prev, id]);
      }
      
      // Update the listings to reflect the new heart count and hot items
      const categoryParam = category ? `&category=${category}` : '';
      const [updatedListings, hotItemsData] = await Promise.all([
        getListings(`?status=available${categoryParam}`),
        getHotItems()
      ]);
      setListings(updatedListings);
      setHotItems(new Set(hotItemsData.map(listing => listing.id)));
    } catch (error) {
      console.error('Error toggling heart:', error);
      // If there's an error, refresh both listings and hearted listings to ensure consistency
      const categoryParam = category ? `&category=${category}` : '';
      const [updatedListings, hearted, hotItemsData] = await Promise.all([
        getListings(`?status=available${categoryParam}`),
        getHeartedListings(),
        getHotItems()
      ]);
      setListings(updatedListings);
      setHeartedListings(hearted.map(listing => listing.id));
      setHotItems(new Set(hotItemsData.map(listing => listing.id)));
    }
  };

  const filteredListings = listings.filter(listing => {
    // Apply hot items filter
    if (showHotOnly) return hotItems.has(listing.id);
    
    // Apply price filter
    if (selectedPrice > 0 && listing.price > selectedPrice) return false;
    
    // Apply condition filter
    if (selectedCondition && listing.condition !== selectedCondition) return false;
    
    // Apply auction filter
    if (selectedAuctionFilter !== 'all') {
      const isAuction = listing.pricing_mode?.toLowerCase() === 'auction';
      if (selectedAuctionFilter === 'auction' && !isAuction) return false;
      if (selectedAuctionFilter === 'fixed' && isAuction) return false;
    }
    
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
        <div className="flex justify-between items-center mb-8">
          <div className="flex space-x-4">
            <button
              onClick={clearFilters}
              className="px-4 py-2 rounded-md bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Clear Filters
            </button>
          </div>
        </div>
        <div className="flex flex-col space-y-8">
          {/* Search Results Header */}
          {searchQuery && (
            <div className="text-xl font-bold">
              Search results for "{searchQuery}"
            </div>
          )}

          {/* Category Header */}
          {category && (
            <div className="text-xl font-bold">
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-wrap gap-4 items-center">
            {/* Price Range Filter */}
            <select
              value={selectedPrice}
              onChange={handlePriceChange}
              className="rounded-md border border-gray-300 py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {priceRanges.map((range) => (
                <option key={range.max} value={range.max}>
                  {range.label}
                </option>
              ))}
            </select>

            {/* Condition Filter */}
            <select
              value={selectedCondition}
              onChange={handleConditionChange}
              className="rounded-md border border-gray-300 py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Any Condition</option>
              {conditions.map((condition) => (
                <option key={condition} value={condition}>
                  {condition}
                </option>
              ))}
            </select>

            {/* Auction Filter */}
            <select
              value={selectedAuctionFilter}
              onChange={handleAuctionFilterChange}
              className="rounded-md border border-gray-300 py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Items</option>
              <option value="auction">Auction Only</option>
              <option value="fixed">Fixed Price Only</option>
            </select>

            {/* Hot Items Toggle */}
            <button
              onClick={handleHotItemsClick}
              className={`px-4 py-2 rounded-md ${
                showHotOnly
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 border border-gray-300'
              }`}
            >
              🔥 Hot Items
            </button>
          </div>

          {/* Listings Grid */}
          <div>
            <h2 className="text-xl font-bold mb-6">
              {showHotOnly
                ? "Hot Items"
                : selectedPrice > 0 || selectedCondition
                ? `Filtered Items${selectedPrice > 0 ? ` under $${selectedPrice}` : ''}${selectedCondition ? ` in ${selectedCondition} condition` : ''}`
                : 'All Items'}
            </h2>
            {filteredListings.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-xl text-gray-600">
                  {searchQuery
                    ? `No items found matching "${searchQuery}"`
                    : showHotOnly
                    ? "No hot items available at the moment"
                    : selectedPrice > 0 || selectedCondition
                    ? `No items found${selectedPrice > 0 ? ` under $${selectedPrice}` : ''}${selectedCondition ? ` in ${selectedCondition} condition` : ''}`
                    : category
                    ? `No ${category} available in the marketplace yet`
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
                    isHot={hotItems.has(listing.id)}
                    isAuction={listing.pricing_mode?.toLowerCase() === 'auction'}
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
          onUpdate={async () => {
            const categoryParam = category ? `&category=${category}` : '';
            const [updatedListings, hotItemsData] = await Promise.all([
              getListings(`?status=available${categoryParam}`),
              getHotItems()
            ]);
            setListings(updatedListings);
            setHotItems(new Set(hotItemsData.map(listing => listing.id)));
          }}
          onHeart={() => handleHeartClick(selectedListing.id)}
          onUnheart={() => handleHeartClick(selectedListing.id)}
          onRequestToBuy={() => {
            console.log('Request to buy:', selectedListing.id);
          }}
          onPlaceBid={async (amount) => {
            try {
              await placeBid({
                listing_id: selectedListing.id,
                bidder_id: currentUserId,
                amount
              });
              const categoryParam = category ? `&category=${category}` : '';
              const [updatedListings, hotItemsData] = await Promise.all([
                getListings(`?status=available${categoryParam}`),
                getHotItems()
              ]);
              setListings(updatedListings);
              setHotItems(new Set(hotItemsData.map(listing => listing.id)));
            } catch (error) {
              console.error('Error placing bid:', error);
            }
          }}
          currentUserId={currentUserId}
        />
      )}
    </div>
  );
};

export default MarketplacePage; 