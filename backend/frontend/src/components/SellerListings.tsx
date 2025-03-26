// Fetches and displays seller's listings
import React, { useEffect, useState } from 'react';
import { Listing, getUserListings } from '../services/listingService';

const SellerListings: React.FC = () => {
  const [listings, setListings] = useState<Listing[]>([]);

  useEffect(() => {
    const loadListings = async () => {
      try {
        const data = await getUserListings();
        setListings(data);
      } catch (error) {
        console.error('Error loading listings:', error);
      }
    };
    loadListings();
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">My Listings</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {listings.map(listing => (
          <div key={listing.id} className="border p-4 rounded-lg shadow">
            {listing.images && listing.images.length > 0 && (
              <img 
                src={listing.images[0]} 
                alt={listing.title} 
                className="w-full h-48 object-cover rounded-md mb-4"
              />
            )}
            <h3 className="text-lg font-semibold">{listing.title}</h3>
            <p className="text-gray-600">${listing.price}</p>
            <p className="text-sm text-gray-500 mt-2">{listing.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SellerListings;
