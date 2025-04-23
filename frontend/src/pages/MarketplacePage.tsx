import React, { useEffect, useState } from 'react';
import { Listing, getListings } from '../services/listingService';

const MarketplacePage: React.FC = () => {
  console.log('MARKETPLACE PAGE IS MOUNTING!');
  const [listings, setListings] = useState<Listing[]>([]);

  useEffect(() => {
    console.log('MARKETPLACE PAGE EFFECT RUNNING!');
    const fetchListings = async () => {
      try {
        console.log('MARKETPLACE PAGE FETCHING LISTINGS!');
        const data = await getListings('?status=available');
        console.log('MARKETPLACE PAGE GOT LISTINGS:', data);
        setListings(data);
      } catch (error) {
        console.error('MARKETPLACE PAGE ERROR:', error);
      }
    };
    fetchListings();
  }, []);

  console.log('MARKETPLACE PAGE RENDERING WITH LISTINGS:', listings);

  return (
    <div style={{ padding: '20px' }}>
      <h1>Marketplace</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
        {listings.map(listing => (
          <div key={listing.id} style={{ border: '1px solid #ccc', padding: '10px' }}>
            <h2>{listing.title}</h2>
            <p>${listing.price}</p>
            {listing.images && listing.images[0] && (
              <img src={listing.images[0]} alt={listing.title} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MarketplacePage; 