import React, { useEffect, useState } from 'react';
import ListingCard from '../components/ListingCard';
import { Listing, getListings } from '../services/listingService';

const MarketplacePage: React.FC = () => {
  console.log('MarketplacePage component mounted');
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        console.log('Fetching listings...');
        const data = await getListings('?status=available');
        console.log('Received listings:', data);
        
        if (!Array.isArray(data)) {
          throw new Error('Invalid response format');
        }
        
        setListings(data);
      } catch (error) {
        console.error('Error fetching listings:', error);
        setError('Failed to load listings');
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, []);

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Marketplace</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {listings.map((listing) => (
          <ListingCard
            key={listing.id}
            listing={listing}
            isHearted={false}
            onHeartClick={() => {}}
            onClick={() => {}}
          />
        ))}
      </div>
    </div>
  );
};

export default MarketplacePage; 