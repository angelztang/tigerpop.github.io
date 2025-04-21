import React, { useState, useEffect } from 'react';
import { getBuyerListings, Listing } from '../services/listingService';
import { getNetid } from '../services/authService';

const BuyerDashboard: React.FC = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const netid = getNetid();

  useEffect(() => {
    const fetchListings = async () => {
      try {
        if (!netid) {
          throw new Error('No netid found');
        }
        console.log('Fetching listings for netid:', netid);
        const data = await getBuyerListings(netid);
        setListings(data);
      } catch (err) {
        console.error('Error fetching listings:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch listings');
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, [netid]);

  return (
    <div>
      {/* Render your component content here */}
    </div>
  );
};

export default BuyerDashboard; 