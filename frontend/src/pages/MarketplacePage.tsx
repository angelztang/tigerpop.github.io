import React, { useEffect, useState } from 'react';
import ListingCard from '../components/ListingCard';
import { Listing, getListings } from '../services/listingService';
import ListingDetailModal from '../components/ListingDetailModal';

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

  const priceRanges: PriceRange[] = [
    { label: 'Under $10', max: 10 },
    { label: 'Under $15', max: 15 },
    { label: 'Under $20', max: 20 },
    { label: 'Under $50', max: 50 },
  ];

  const categories: Category[] = [
    { name: 'Tops', image: '/images/placeholder.svg', slug: 'tops' },
    { name: 'Bottoms', image: '/images/placeholder.svg', slug: 'bottoms' },
    { name: 'Shoes', image: '/images/placeholder.svg', slug: 'shoes' },
    { name: 'Dresses', image: '/images/placeholder.svg', slug: 'dresses' },
    { name: 'Fridges', image: '/images/placeholder.svg', slug: 'fridges' },
    { name: 'Couches', image: '/images/placeholder.svg', slug: 'couches' },
  ];

  const fetchListings = async () => {
    try {
      setLoading(true);
      setError(null);
      let url = '';
      const params = new URLSearchParams();
      
      if (selectedPrice) {
        params.append('max_price', selectedPrice.toString());
      }
      
      if (selectedCategory) {
        params.append('category', selectedCategory);
      }
      
      if (params.toString()) {
        url = `?${params.toString()}`;
      }
      
      const data = await getListings(url);
      setListings(data);
    } catch (error) {
      console.error('Error fetching listings:', error);
      setError('Failed to load listings. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [selectedPrice, selectedCategory]);

  const handleCategoryClick = (slug: string) => {
    setSelectedCategory(selectedCategory === slug ? null : slug);
    setSelectedPrice(null); // Reset price filter when changing category
  };

  const handlePriceClick = (max: number) => {
    setSelectedPrice(selectedPrice === max ? null : max);
  };

  const handlePurchase = async (listing: Listing) => {
    try {
      // TODO: Implement purchase logic
      console.log('Purchasing listing:', listing.id);
      setSelectedListing(null);
      fetchListings();
    } catch (err) {
      setError('Failed to purchase listing');
      console.error('Error purchasing listing:', err);
    }
  };

  const filteredListings = selectedCategory
    ? listings.filter(listing => listing.category === selectedCategory)
    : selectedPrice
    ? listings.filter(listing => listing.price <= selectedPrice)
    : listings;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl">Loading listings...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-red-600">{error}</div>
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
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 hover:bg-gray-200'
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((category) => (
            <button
              key={category.slug}
              onClick={() => handleCategoryClick(category.slug)}
              className={`p-4 rounded-lg text-center ${
                selectedCategory === category.slug
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <img
                src={category.image}
                alt={category.name}
                className="w-16 h-16 mx-auto mb-2"
              />
              <span>{category.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Filtered Listings */}
      {(selectedPrice || selectedCategory) && (
        <div className="mt-12">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              {selectedCategory
                ? `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}`
                : selectedPrice
                ? `Items Under $${selectedPrice}`
                : 'All Items'}
            </h2>
            {(selectedPrice || selectedCategory) && (
              <button
                onClick={() => {
                  setSelectedPrice(null);
                  setSelectedCategory(null);
                }}
                className="text-orange-500 hover:text-orange-600"
              >
                Clear Filters
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                onDelete={() => {}}
              />
            ))}
          </div>
        </div>
      )}

      {/* All Listings */}
      {!selectedPrice && !selectedCategory && (
        <div className="mt-12">
          <h2 className="text-xl font-semibold mb-4">All Items</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                onDelete={() => {}}
              />
            ))}
          </div>
        </div>
      )}

      {selectedListing && (
        <ListingDetailModal
          listing={selectedListing}
          onClose={() => setSelectedListing(null)}
          onPurchase={() => handlePurchase(selectedListing)}
        />
      )}
    </div>
  );
};

export default MarketplacePage; 