import React, { useState, useEffect } from 'react';
import { Listing, getListings } from '../services/listingService';
import ListingCard from "../components/ListingCard";

type FilterType = 'all' | 'saved' | 'pending' | 'purchased';

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
    { label: 'Saved', value: 'saved' },
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
          ))}
        </div>
      ) : (
        <p className="text-gray-500">You haven't purchased anything yet.</p>
      )}
    </div>
  );
};

export default BuyerDashboard;
