<<<<<<< HEAD
import React, { useState, useEffect } from 'react';
import { Listing, getListings } from '../services/listingService';
import ListingCard from "../components/ListingCard";

type FilterType = 'all' | 'pending' | 'purchased';

const BuyerDashboard: React.FC = () => {
  const [purchases, setPurchases] = useState<Listing[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    try {
      const data = await getListings('/api/purchases');
      setPurchases(data);
    } catch (error) {
      console.error('Error fetching purchases:', error);
    }
  };

  const filterTabs: { label: string; value: FilterType }[] = [
    { label: 'All', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'Purchased', value: 'purchased' },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* User Profile Section */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
        <h2 className="text-xl">netid</h2>
      </div>

      {/* Purchases Header */}
      <h1 className="text-2xl font-bold mb-6">My Purchases</h1>

      {/* Filter Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-8">
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveFilter(tab.value)}
              className={`pb-4 px-1 ${
                activeFilter === tab.value
                  ? 'border-b-2 border-black font-medium'
                  : 'text-gray-500'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Purchase History Grid */}
      {purchases.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {purchases.map((item) => (
            <ListingCard key={item.id} item={item} userType="buyer" />
=======
// this should be buyer's purchase history, similar to SellerDashboard
import React, { useState, useEffect } from 'react';
import { getListings } from '../services/listingService';
import { Listing } from '../services/listingService';
import ListingCard from '../components/ListingCard';

const BuyerDashboard: React.FC = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      const data = await getListings();
      setListings(data);
    } catch (err) {
      setError('Failed to load listings');
      console.error('Error fetching listings:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Purchases</h1>

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              onDelete={() => {}}
            />
>>>>>>> c4d72ccc050220ad09ebb324fa9247b67b9a7908
          ))}
        </div>
      ) : (
        <p className="text-gray-500">You haven't purchased anything yet.</p>
      )}
    </div>
  );
};

export default BuyerDashboard;
