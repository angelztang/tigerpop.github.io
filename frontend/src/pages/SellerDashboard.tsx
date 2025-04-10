// Shows seller's listings + create listing button
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getListings, createListing, deleteListing, Listing, CreateListingData, getUserListings, updateListing, updateListingStatus } from '../services/listingService';
import { getUserId } from '../services/authService';
import ListingForm from '../components/ListingForm';
import ListingCard from '../components/ListingCard';

type FilterTab = 'all' | 'selling' | 'sold';

const SellerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [editingListing, setEditingListing] = useState<Listing | null>(null);

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      const userId = getUserId();
      if (!userId) {
        setError('User not authenticated');
        return;
      }
      const data = await getUserListings(userId);
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
        setListings([response, ...listings]);
        setShowForm(false);
      }
    } catch (err) {
      console.error('Error in listing creation response:', err);
      setError('Failed to create listing. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleListingUpdated = async (formData: { title: string; description: string; price: string; category: string; images: string[]; id?: number }) => {
    setIsSubmitting(true);
    setError(null);
    try {
      if (!editingListing) {
        setError('No listing selected for editing');
        return;
      }

      const listingId = formData.id || editingListing.id;
      const updatedListing = await updateListing(listingId, {
        ...formData,
        price: parseFloat(formData.price)
      });

      setListings(listings.map(listing => 
        listing.id === updatedListing.id ? updatedListing : listing
      ));
      setEditingListing(null);
      setShowForm(false);
    } catch (err) {
      setError('Failed to update listing');
      console.error('Error updating listing:', err);
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

  const handleMarkAsSold = async (id: number) => {
    try {
      await updateListingStatus(id, 'sold');
      setListings(listings.map(listing => 
        listing.id === id ? { ...listing, status: 'sold' } : listing
      ));
    } catch (err) {
      setError('Failed to mark listing as sold');
      console.error('Error marking listing as sold:', err);
    }
  };

  const handleEditListing = (listing: Listing) => {
    setEditingListing(listing);
    setShowForm(true);
  };

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
            onClick={() => {
              setEditingListing(null);
              setShowForm(true);
            }}
            className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 transition-colors"
          >
            Create New Listing
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {showForm && (
          <ListingForm
            onSubmit={editingListing ? handleListingUpdated : handleListingCreated}
            isSubmitting={isSubmitting}
            onClose={() => {
              setShowForm(false);
              setEditingListing(null);
            }}
            initialData={editingListing ? {
              id: editingListing.id,
              title: editingListing.title,
              description: editingListing.description,
              price: editingListing.price.toString(),
              category: editingListing.category,
              images: editingListing.images
            } : undefined}
            isEditMode={!!editingListing}
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
          {filteredListings.length > 0 ? (
            filteredListings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                onDelete={() => handleDeleteListing(listing.id)}
                onMarkAsSold={() => handleMarkAsSold(listing.id)}
                onEdit={() => handleEditListing(listing)}
                isSellerMode={true}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-xl text-gray-600">You have no listings yet</p>
              <button
                onClick={() => {
                  setEditingListing(null);
                  setShowForm(true);
                }}
                className="mt-4 bg-orange-500 text-white px-6 py-2 rounded-md hover:bg-orange-600 transition-colors"
              >
                Create Your First Listing
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerDashboard;
