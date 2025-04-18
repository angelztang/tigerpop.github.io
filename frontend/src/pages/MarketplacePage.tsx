import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import ListingCard from '../components/ListingCard';
import { Listing, getListings, heartListing, unheartListing, getHeartedListings } from '../services/listingService';
import ListingDetailModal from '../components/ListingDetailModal';
import { isAuthenticated } from '../services/authService';

interface PriceRange {
  label: string;
  max: number;
}

interface Category {
  name: string;
  image: string;
  slug: string;
}

const MarketplacePage: React.FC = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [selectedPrice, setSelectedPrice] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [heartedListings, setHeartedListings] = useState<number[]>([]);
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(false);

  const priceRanges: PriceRange[] = [
    { label: 'Under $10', max: 10 },
    { label: 'Under $15', max: 15 },
    { label: 'Under $20', max: 20 },
    { label: 'Under $50', max: 50 },
  ];

  const categories: Category[] = [
    { name: 'Tops', image: '/categories/tops.png', slug: 'tops' },
    { name: 'Bottoms', image: '/categories/bottoms.png', slug: 'bottoms' },
    { name: 'Dresses', image: '/categories/dresses.png', slug: 'dresses' },
    { name: 'Shoes', image: '/categories/shoes.png', slug: 'shoes' },
    { name: 'Furniture', image: '/categories/furniture.png', slug: 'furniture' },
    { name: 'Appliances', image: '/categories/appliances.png', slug: 'appliances' },
    { name: 'Books', image: '/categories/books.png', slug: 'books' },
    { name: 'Other', image: '/categories/other.png', slug: 'other' },
  ];

  const fetchListings = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      
      // Always filter for available listings
      params.append('status', 'available');
      
      if (selectedPrice) {
        params.append('max_price', selectedPrice.toString());
      }
      
      if (selectedCategory) {
        params.append('category', selectedCategory);
      }
      
      const response = await getListings(params.toString());
      setListings(response);
    } catch (err) {
      setError('Failed to fetch listings');
      console.error('Error fetching listings:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHeartedListings = async () => {
    if (!isUserAuthenticated) return;
    
    try {
      const response = await getHeartedListings();
      setHeartedListings(response.map(listing => listing.id));
    } catch (err) {
      console.error('Error fetching hearted listings:', err);
    }
  };

  useEffect(() => {
    setIsUserAuthenticated(isAuthenticated());
  }, []);

  useEffect(() => {
    fetchListings();
    if (isUserAuthenticated) {
      fetchHeartedListings();
    }
  }, [selectedPrice, selectedCategory, isUserAuthenticated]);

  const handleListingUpdated = () => {
    fetchListings();
    if (isUserAuthenticated) {
      fetchHeartedListings();
    }
  };

  const handleCategoryClick = (slug: string) => {
    setSelectedCategory(selectedCategory === slug ? null : slug);
  };

  const handlePriceClick = (max: number) => {
    setSelectedPrice(selectedPrice === max ? null : max);
  };

  const handleHeartClick = async (id: number) => {
    if (!isUserAuthenticated) {
      // Redirect to login if not authenticated
      window.location.href = '/login';
      return;
    }

    try {
      if (heartedListings.includes(id)) {
        await unheartListing(id);
        setHeartedListings(heartedListings.filter(listingId => listingId !== id));
      } else {
        await heartListing(id);
        setHeartedListings([...heartedListings, id]);
      }
      // If we're on the hearted filter, refresh the listings
      if (selectedCategory === 'hearted') {
        await fetchListings();
      }
    } catch (error) {
      console.error('Error toggling heart:', error);
    }
  };

  const location = useLocation();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const categoryParam = queryParams.get('category');
    setSelectedCategory(categoryParam);
    setSelectedPrice(null);
  }, [location.search]);

  const filteredListings = listings.filter(listing => {
    // Always filter out non-available listings
    if (listing.status !== 'available') return false;
    // Then apply category and price filters if selected
    if (selectedCategory && listing.category.toLowerCase() !== selectedCategory) return false;
    if (selectedPrice && listing.price > selectedPrice) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl">Loading listings...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Marketplace</h1>
      
      {/* Price Filters */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Price Range</h2>
        <div className="flex flex-wrap gap-2">
          {priceRanges.map((range) => (
            <button
              key={range.max}
              onClick={() => handlePriceClick(range.max)}
              className={`px-4 py-2 rounded-full ${
                selectedPrice === range.max
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-800'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category Filters */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Categories</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((category) => (
            <button
              key={category.slug}
              onClick={() => handleCategoryClick(category.slug)}
              className={`p-4 rounded-lg ${
                selectedCategory === category.slug
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-800'
              }`}
            >
              <img
                src={category.image}
                alt={category.name}
                className="w-full h-32 object-cover rounded mb-2"
              />
              <span>{category.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Listings Grid */}
      {loading ? (
        <div className="text-center">Loading...</div>
      ) : error ? (
        <div className="text-center text-red-500">{error}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              isHearted={heartedListings.includes(listing.id)}
              onHeartClick={() => handleHeartClick(listing.id)}
              onClick={() => setSelectedListing(listing)}
            />
          ))}
        </div>
      )}

      {/* Listing Detail Modal */}
      {selectedListing && (
        <ListingDetailModal
          listing={selectedListing}
          isHearted={heartedListings.includes(selectedListing.id)}
          onHeartClick={() => handleHeartClick(selectedListing.id)}
          onClose={() => setSelectedListing(null)}
          onUpdate={handleListingUpdated}
        />
      )}
    </div>
  );
};

export default MarketplacePage; 