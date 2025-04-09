import React, { useState, useEffect } from 'react';
<<<<<<< HEAD
import { Listing, getListings, deleteListing, updateListingStatus } from '../services/listingService';
import ListingForm from "../components/ListingForm";
import ListingEditModal from "../components/ListingEditModal";
import ListingCard from "../components/ListingCard";

type FilterType = 'all' | 'selling' | 'sold';
=======
import { useNavigate } from 'react-router-dom';
import { getListings, createListing, deleteListing, Listing, CreateListingData } from '../services/listingService';
import { getUserId } from '../services/authService';
import ListingForm from '../components/ListingForm';
import ListingCard from '../components/ListingCard';

type FilterTab = 'all' | 'selling' | 'sold';
>>>>>>> c4d72ccc050220ad09ebb324fa9247b67b9a7908

const SellerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
<<<<<<< HEAD
      const data = await getListings('/api/listings');
=======
      const data = await getListings();
>>>>>>> c4d72ccc050220ad09ebb324fa9247b67b9a7908
      setListings(data);
    } catch (err) {
      setError('Failed to load listings');
      console.error('Error fetching listings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleListingCreated = async (formData: { title: string; description: string; price: string; category: string; images: string[] }) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const userId = getUserId();
      if (!userId) {
        setError('User not authenticated');
        return;
      }

      const listingData: CreateListingData = {
        ...formData,
        price: parseFloat(formData.price),
        user_id: parseInt(userId)
      };

      const response = await createListing(listingData);
      if (response) {
        setShowForm(false);
        setTimeout(() => {
          navigate('/marketplace', { replace: true });
        }, 0);
      }
    } catch (err) {
      console.error('Error in listing creation response:', err);
      setShowForm(false);
      setTimeout(() => {
        navigate('/marketplace', { replace: true });
      }, 0);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteListing = async (id: number) => {
    try {
      await deleteListing(id);
      setListings(listings.filter(listing => listing.id !== id));
    } catch (err) {
      setError('Failed to delete listing');
      console.error('Error deleting listing:', err);
    }
  };

<<<<<<< HEAD
  const handleListingUpdate = () => {
    fetchListings();
  };

  const handleMarkAsSold = async (listingId: number) => {
    if (window.confirm('Are you sure you want to mark this item as sold?')) {
      try {
        await updateListingStatus(listingId, 'sold');
        // Refresh the listings to show the updated status
        await fetchListings();
      } catch (error) {
        console.error('Error marking as sold:', error);
        alert('Failed to mark item as sold. Please try again.');
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
        {listings
          .filter(item => {
            switch (activeFilter) {
              case 'selling':
                return item.status !== 'sold';
              case 'sold':
                return item.status === 'sold';
              default:
                return true;
            }
          })
          .map((item) => (
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
=======
  const filteredListings = listings.filter(listing => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'selling') return listing.status === 'available';
    if (activeFilter === 'sold') return listing.status === 'sold';
    return true;
  });

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">My Listings</h1>
          <button
            onClick={() => setShowForm(true)}
            className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 transition-colors"
          >
            Create New Listing
          </button>
>>>>>>> c4d72ccc050220ad09ebb324fa9247b67b9a7908
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {showForm && (
          <ListingForm
            onSubmit={handleListingCreated}
            isSubmitting={isSubmitting}
            onClose={() => setShowForm(false)}
          />
        )}

        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveFilter('all')}
              className={`${
                activeFilter === 'all'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              All
            </button>
            <button
              onClick={() => setActiveFilter('selling')}
              className={`${
                activeFilter === 'selling'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Selling
            </button>
            <button
              onClick={() => setActiveFilter('sold')}
              className={`${
                activeFilter === 'sold'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Sold
            </button>
          </nav>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map(listing => (
            <ListingCard
              key={listing.id}
              listing={listing}
              onDelete={() => handleDeleteListing(listing.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default SellerDashboard;
