import React, { useEffect, useState } from 'react';
import ListingCard from '../components/ListingCard';
import ListingForm from '../components/ListingForm';
import { Listing, getListings } from '../services/listingService';

const ListingsPage: React.FC = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const fetchListings = async () => {
    try {
      const data = await getListings();
      setListings(data);
    } catch (error) {
      console.error('Error fetching listings:', error);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const handleFormClose = () => {
    setShowCreateForm(false);
    fetchListings(); // Refresh listings after form is closed
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Listings</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Create Listing
        </button>
      </div>

      {showCreateForm && (
        <div className="mb-8">
          <ListingForm onClose={handleFormClose} />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {listings.map((listing) => (
          <ListingCard key={listing.id} item={listing} />
        ))}
      </div>
    </div>
  );
};

export default ListingsPage; 