import React, { useEffect, useState } from 'react';
import { getListings } from '../services/listingService';
import { Listing } from '../services/listingService';
import { API_URL } from '../config';

interface ListingGridProps {
  selectedPrice?: number | null;
  selectedCategory?: string | null;
}

const ListingGrid: React.FC<ListingGridProps> = ({ selectedPrice, selectedCategory }) => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching listings from:', `${API_URL}/api/listings`); // Debug log
        
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
        
        console.log('Making request to:', url); // Debug log
        const data = await getListings(url);
        console.log('Received listings:', data); // Debug log
        
        setListings(data);
      } catch (err) {
        console.error('Error fetching listings:', err);
        setError('Failed to load listings. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, [selectedPrice, selectedCategory]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No listings found.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {listings.map((listing) => (
        <div key={listing.id} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          <div className="aspect-w-16 aspect-h-9">
            <img
              src={listing.images[0] || '/images/placeholder.svg'}
              alt={listing.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-2">{listing.title}</h3>
            <p className="text-orange-500 font-bold mb-2">${listing.price}</p>
            <p className="text-gray-600 text-sm mb-2">{listing.category}</p>
            <p className="text-gray-700 line-clamp-2">{listing.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ListingGrid; 