import React, { useState, useEffect } from 'react';
import { getListings, Listing, ListingFilters } from '../services/listingService';
import ListingCard from '../components/ListingCard';
import ListingFiltersComponent from '../components/ListingFilters';

const Listings: React.FC = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchListings = async (filters?: ListingFilters) => {
    try {
      setLoading(true);
      const data = await getListings(filters);
      setListings(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch listings');
      console.error('Error fetching listings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const handleFilterChange = (filters: ListingFilters) => {
    fetchListings(filters);
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (error) {
    return <div className="text-center py-12 text-red-600">{error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Browse Listings</h1>
      
      <ListingFiltersComponent onFilterChange={handleFilterChange} />
      
      {listings.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">No listings found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Listings; 