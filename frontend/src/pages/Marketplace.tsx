import React, { useState, useEffect } from 'react';
import { getListings, Listing, ListingFilters } from '../services/listingService';
import ListingCard from '../components/ListingCard';
import ListingFiltersComponent from '../components/ListingFilters';

const Marketplace: React.FC = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ListingFilters>({});

  const fetchListings = async (newFilters?: ListingFilters) => {
    try {
      setLoading(true);
      const data = await getListings(newFilters);
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

  const handleFilterChange = (newFilters: ListingFilters) => {
    setFilters(newFilters);
    fetchListings(newFilters);
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (error) {
    return <div className="text-center py-12 text-red-600">{error}</div>;
  }

  const filteredListings = listings.filter(listing => {
    if (filters.category && listing.category !== filters.category) return false;
    if (filters.min_price && listing.price < filters.min_price) return false;
    if (filters.max_price && listing.price > filters.max_price) return false;
    if (filters.condition && listing.condition !== filters.condition) return false;
    if (filters.search && !listing.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Marketplace</h1>
      
      <ListingFiltersComponent onFilterChange={handleFilterChange} />
      
      {filteredListings.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">No listings found matching your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Marketplace; 