import React, { useState, useEffect } from 'react';
import { Listing, getListings, deleteListing, updateListingStatus } from '../services/listingService';
import ListingForm from "../components/ListingForm";
import ListingEditModal from "../components/ListingEditModal";
import ListingCard from "../components/ListingCard";

type FilterType = 'all' | 'selling' | 'sold';

const SellerDashboard: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [listings, setListings] = useState<Listing[]>([]);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      const data = await getListings('/api/listings');
      setListings(data);
    } catch (error) {
      console.error('Error fetching listings:', error);
    }
  };

  const handleEditClick = (listing: Listing) => {
    setSelectedListing(listing);
  };

  const handleEditClose = () => {
    setSelectedListing(null);
  };

  const handleListingUpdate = () => {
    fetchListings();
  };

  const handleMarkAsSold = async (listingId: number) => {
    if (window.confirm('Are you sure you want to mark this item as sold?')) {
      try {
        await updateListingStatus(listingId, 'sold');
        fetchListings(); // Refresh the listings after marking as sold
      } catch (error) {
        console.error('Error marking as sold:', error);
      }
    }
  };

  const handleDelete = async (listingId: number) => {
    try {
      await deleteListing(listingId);
      fetchListings(); // Refresh the listings after deletion
    } catch (error) {
      console.error('Error deleting listing:', error);
      // Let the ListingCard component handle the error display
    }
  };

  const filterTabs: { label: string; value: FilterType }[] = [
    { label: 'All', value: 'all' },
    { label: 'Selling', value: 'selling' },
    { label: 'Sold', value: 'sold' },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* User Profile Section */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
        <h2 className="text-xl">netid</h2>
      </div>

      {/* Listings Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Listings</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
        >
          Create new post
        </button>
      </div>

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

      {/* Filtered Listings */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {listings.map((item) => (
          <div key={item.id} className="group relative">
            <ListingCard
              item={item}
              userType="seller"
              onEdit={() => handleEditClick(item)}
              onDelete={() => handleDelete(item.id)}
              onMarkAsSold={() => handleMarkAsSold(item.id)}
            />
          </div>
        ))}
      </div>

      {/* Create Listing Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Create New Listing</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <ListingForm onClose={() => setShowForm(false)} />
          </div>
        </div>
      )}

      {/* Edit Listing Modal */}
      {selectedListing && (
        <ListingEditModal
          listing={selectedListing}
          onClose={handleEditClose}
          onUpdate={handleListingUpdate}
        />
      )}
    </div>
  );
};

export default SellerDashboard;
