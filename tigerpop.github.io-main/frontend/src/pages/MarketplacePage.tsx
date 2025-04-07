import React, { useEffect, useState } from 'react';
import ListingCard from '../components/ListingCard';
import { Listing, getListings } from '../services/listingService';

interface PriceRange {
  label: string;
  max: number;
}

interface Category {
  name: string;
  image: string;
  slug: string;
}

const ListingsPage: React.FC = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [selectedPrice, setSelectedPrice] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

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
      let url = '/api/listings';
      const params = new URLSearchParams();
      
      if (selectedPrice) {
        params.append('max_price', selectedPrice.toString());
      }
      
      if (selectedCategory) {
        params.append('category', selectedCategory);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const data = await getListings(url);
      setListings(data);
    } catch (error) {
      console.error('Error fetching listings:', error);
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

  const filteredListings = listings;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Shop By Price */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Shop By Price</h2>
        <div className="flex space-x-4">
          {priceRanges.map((range) => (
            <button
              key={range.max}
              onClick={() => handlePriceClick(range.max)}
              className={`px-6 py-3 rounded-lg transition-colors ${
                selectedPrice === range.max
                  ? 'bg-orange-200 text-orange-800'
                  : 'bg-orange-100 bg-opacity-50 text-gray-700 hover:bg-orange-200'
              }`}
            >
              Under ${range.max}
            </button>
          ))}
        </div>
      </div>

      {/* Shop By Piece */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Shop By Piece</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {categories.map((category) => (
            <div
              key={category.slug}
              onClick={() => handleCategoryClick(category.slug)}
              className={`relative aspect-[4/3] rounded-lg overflow-hidden cursor-pointer group transition-transform transform hover:scale-105 ${
                selectedCategory === category.slug ? 'ring-2 ring-orange-500' : ''
              }`}
            >
              <img
                src={category.image}
                alt={category.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent group-hover:from-black/60" />
              <div className="absolute bottom-4 left-4 text-white text-lg font-semibold">
                {category.name}
              </div>
            </div>
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
              <ListingCard key={listing.id} item={listing} />
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
              <ListingCard key={listing.id} item={listing} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ListingsPage; 