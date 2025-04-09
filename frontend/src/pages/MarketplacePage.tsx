import React, { useEffect, useState } from 'react';
import ListingCard from '../components/ListingCard';
import { Listing, getListings } from '../services/listingService';
<<<<<<< HEAD
=======
import ListingDetailModal from '../components/ListingDetailModal';
>>>>>>> c4d72ccc050220ad09ebb324fa9247b67b9a7908

interface PriceRange {
  label: string;
  max: number;
}

interface Category {
  name: string;
  image: string;
  slug: string;
}

<<<<<<< HEAD
const ListingsPage: React.FC = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [selectedPrice, setSelectedPrice] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
=======
const MarketplacePage: React.FC = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [selectedPrice, setSelectedPrice] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
>>>>>>> c4d72ccc050220ad09ebb324fa9247b67b9a7908

  const priceRanges: PriceRange[] = [
    { label: 'Under $10', max: 10 },
    { label: 'Under $15', max: 15 },
    { label: 'Under $20', max: 20 },
    { label: 'Under $50', max: 50 },
  ];

  const categories: Category[] = [
<<<<<<< HEAD
    { name: 'Tops', image: '/images/placeholder.svg', slug: 'tops' },
    { name: 'Bottoms', image: '/images/placeholder.svg', slug: 'bottoms' },
    { name: 'Shoes', image: '/images/placeholder.svg', slug: 'shoes' },
    { name: 'Dresses', image: '/images/placeholder.svg', slug: 'dresses' },
    { name: 'Fridges', image: '/images/placeholder.svg', slug: 'fridges' },
    { name: 'Couches', image: '/images/placeholder.svg', slug: 'couches' },
=======
    { name: 'Tops', image: '/category-placeholder.jpg', slug: 'tops' },
    { name: 'Bottoms', image: '/category-placeholder.jpg', slug: 'bottoms' },
    { name: 'Shoes', image: '/category-placeholder.jpg', slug: 'shoes' },
    { name: 'Dresses', image: '/category-placeholder.jpg', slug: 'dresses' },
    { name: 'Furniture', image: '/category-placeholder.jpg', slug: 'furniture' },
    { name: 'Other', image: '/category-placeholder.jpg', slug: 'other' },
>>>>>>> c4d72ccc050220ad09ebb324fa9247b67b9a7908
  ];

  const fetchListings = async () => {
    try {
<<<<<<< HEAD
      let url = '/api/listings';
=======
      setLoading(true);
      setError(null);
      let url = '';
>>>>>>> c4d72ccc050220ad09ebb324fa9247b67b9a7908
      const params = new URLSearchParams();
      
      if (selectedPrice) {
        params.append('max_price', selectedPrice.toString());
      }
      
      if (selectedCategory) {
        params.append('category', selectedCategory);
      }
      
      if (params.toString()) {
<<<<<<< HEAD
        url += `?${params.toString()}`;
=======
        url = `?${params.toString()}`;
>>>>>>> c4d72ccc050220ad09ebb324fa9247b67b9a7908
      }
      
      const data = await getListings(url);
      setListings(data);
    } catch (error) {
      console.error('Error fetching listings:', error);
<<<<<<< HEAD
=======
      setError('Failed to load listings. Please try again later.');
    } finally {
      setLoading(false);
>>>>>>> c4d72ccc050220ad09ebb324fa9247b67b9a7908
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

<<<<<<< HEAD
  const filteredListings = listings;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Shop By Price */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Shop By Price</h2>
        <div className="flex space-x-4">
=======
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
>>>>>>> c4d72ccc050220ad09ebb324fa9247b67b9a7908
          {priceRanges.map((range) => (
            <button
              key={range.max}
              onClick={() => handlePriceClick(range.max)}
<<<<<<< HEAD
              className={`px-6 py-3 rounded-lg transition-colors ${
                selectedPrice === range.max
                  ? 'bg-orange-200 text-orange-800'
                  : 'bg-orange-100 bg-opacity-50 text-gray-700 hover:bg-orange-200'
              }`}
            >
              Under ${range.max}
=======
              className={`px-6 py-2 rounded-lg ${
                selectedPrice === range.max
                  ? 'bg-orange-100 text-orange-700'
                  : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
              } transition-colors duration-200`}
            >
              {range.label}
>>>>>>> c4d72ccc050220ad09ebb324fa9247b67b9a7908
            </button>
          ))}
        </div>
      </div>

<<<<<<< HEAD
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
=======
      {/* Category Cards */}
      <div className="mb-12">
        <h2 className="text-xl font-bold mb-4">Shop By Piece</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
>>>>>>> c4d72ccc050220ad09ebb324fa9247b67b9a7908
              <img
                src={category.image}
                alt={category.name}
                className="w-full h-full object-cover"
              />
<<<<<<< HEAD
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent group-hover:from-black/60" />
              <div className="absolute bottom-4 left-4 text-white text-lg font-semibold">
                {category.name}
              </div>
            </div>
=======
              <span className="absolute bottom-4 left-4 text-white text-xl font-medium">
                {category.name}
              </span>
            </button>
>>>>>>> c4d72ccc050220ad09ebb324fa9247b67b9a7908
          ))}
        </div>
      </div>

<<<<<<< HEAD
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
=======
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
          onPurchase={() => {}}
        />
>>>>>>> c4d72ccc050220ad09ebb324fa9247b67b9a7908
      )}
    </div>
  );
};

<<<<<<< HEAD
export default ListingsPage; 
=======
export default MarketplacePage; 
>>>>>>> c4d72ccc050220ad09ebb324fa9247b67b9a7908
