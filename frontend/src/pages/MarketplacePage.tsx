import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
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

  const location = useLocation();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const categoryParam = queryParams.get('category');
    setSelectedCategory(categoryParam);
    setSelectedPrice(null); // Reset price when URL changes category
  }, [location.search]);

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

  const filteredListings = listings.filter(listing => {
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

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Price Filters */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Shop By Price</h2>
        <div className="flex flex-wrap gap-3">
          {priceRanges.map((range) => (
            <button
              key={range.max}
              onClick={() => handlePriceClick(range.max)}
              className={`px-6 py-2 rounded-lg ${
                selectedPrice === range.max
                  ? 'bg-orange-100 text-orange-700'
                  : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
              } transition-colors duration-200`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category Cards */}
      <div className="mb-12">
        <h2 className="text-xl font-bold mb-4">Shop By Piece</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((category) => (
            <button
              key={category.slug}
              onClick={() => handleCategoryClick(category.slug)}
              className={`relative overflow-hidden rounded-lg aspect-[4/3] group ${
                selectedCategory === category.slug
                  ? 'ring-2 ring-orange-500'
                  : ''
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black opacity-60"></div>
              <img
                src={category.image}
                alt={category.name}
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-4 left-4 text-white text-xl font-medium">
                {category.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* All Items Section */}
      <div>
        <h2 className="text-xl font-bold mb-6">All Items</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              onDelete={() => {}}
            />
          ))}
        </div>
      </div>

      {/* Listing Detail Modal */}
      {selectedListing && (
        <ListingDetailModal
          listing={selectedListing}
          onClose={() => setSelectedListing(null)}
        />
      )}
    </div>
  );
};

export default MarketplacePage; 