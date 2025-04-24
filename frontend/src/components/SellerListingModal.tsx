import React, { useState, useEffect } from 'react';
import { Listing, updateListing, updateListingStatus, deleteListing, uploadImages, closeBidding, getBids, Bid } from '../services/listingService';

const categories = [
  'Tops',
  'Bottoms',
  'Dresses',
  'Shoes',
  'Furniture',
  'Appliances',
  'Books',
  'Other'
];

const conditions = [
  'New',
  'Like New',
  'Good',
  'Fair',
  'Poor'
];

interface SellerListingModalProps {
  listing: Listing;
  onClose: () => void;
  onUpdate: (updatedListing: Listing) => void;
  onDelete: (listingId: number) => void;
}

const SellerListingModal: React.FC<SellerListingModalProps> = ({ listing, onClose, onUpdate, onDelete }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editedListing, setEditedListing] = useState(listing);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSoldModal, setShowSoldModal] = useState(false);
  const [bids, setBids] = useState<Bid[]>([]);

  useEffect(() => {
    if (listing.pricing_mode === 'auction') {
      fetchBids();
    }
  }, [listing.id]);

  const fetchBids = async () => {
    try {
      const fetchedBids = await getBids(listing.id);
      setBids(fetchedBids);
    } catch (error) {
      console.error('Error fetching bids:', error);
    }
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? listing.images.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === listing.images.length - 1 ? 0 : prev + 1
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditedListing(prev => ({
      ...prev,
      [name]: name === 'price' ? parseFloat(value) : value
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setNewImages(prev => [...prev, ...files]);
    }
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      let updatedImages = listing.images;
      
      // Upload new images if any
      if (newImages.length > 0) {
        const uploadedUrls = await uploadImages(newImages);
        updatedImages = [...listing.images, ...uploadedUrls];
      }

      // Update the listing
      const updatedListing = await updateListing(listing.id, {
        ...editedListing,
        images: updatedImages
      });

      onUpdate(updatedListing);
      setIsEditing(false);
    } catch (error: any) {
      console.error('Error updating listing:', error);
      setError(error.response?.data?.error || 'Failed to update listing');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkAsSold = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const updatedListing = await updateListingStatus(listing.id, 'sold');
      onUpdate(updatedListing);
      setShowSoldModal(false);
      onClose();
    } catch (error: any) {
      console.error('Error marking listing as sold:', error);
      setError(error.response?.data?.error || 'Failed to mark listing as sold');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await deleteListing(listing.id);
      onDelete(listing.id);
      onClose();
    } catch (error: any) {
      console.error('Error deleting listing:', error);
      setError(error.response?.data?.error || 'Failed to delete listing');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseBidding = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await closeBidding(listing.id);
      onUpdate({ ...listing, status: 'pending' });
      onClose();
    } catch (err) {
      setError('Failed to close bidding');
      console.error('Error closing bidding:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold">
                {isEditing ? (
                  <input
                    type="text"
                    name="title"
                    value={editedListing.title}
                    onChange={handleInputChange}
                    className="border rounded px-2 py-1 w-full"
                  />
                ) : (
                  listing.title
                )}
              </h2>
              {listing.pricing_mode === 'auction' && (
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  🏷️ Auction Item
                </span>
              )}
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Image Carousel */}
            <div className="relative mb-6">
              <div className="h-96 w-full">
                {listing.images?.[currentImageIndex] && (
                  <img
                    src={listing.images[currentImageIndex]}
                    alt={listing.title}
                    className="w-full h-full object-contain rounded-lg bg-gray-100"
                  />
                )}
              </div>
              {listing.images.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-75 rounded-full p-2 hover:bg-opacity-100 transition-opacity"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-75 rounded-full p-2 hover:bg-opacity-100 transition-opacity"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}
              <div className="flex justify-center mt-2 space-x-2">
                {listing.images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-2 h-2 rounded-full ${
                      index === currentImageIndex ? 'bg-orange-500' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
              {isEditing && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Add More Images
                  </label>
                  <input
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                    onChange={handleImageUpload}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0
                      file:text-sm file:font-semibold
                      file:bg-orange-50 file:text-orange-700
                      hover:file:bg-orange-100"
                  />
                  <p className="mt-1 text-sm text-gray-500">Accepted formats: JPG, JPEG, PNG</p>
                </div>
              )}
            </div>

            {/* Listing Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Description</h3>
                {isEditing ? (
                  <textarea
                    name="description"
                    value={editedListing.description}
                    onChange={handleInputChange}
                    className="border rounded px-2 py-1 w-full h-32"
                  />
                ) : (
                  <p className="text-gray-600">{listing.description}</p>
                )}
              </div>

              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">Price</h3>
                {listing.pricing_mode === 'auction' ? (
                  <div>
                    <p className="text-orange-500 text-xl font-bold">
                      {listing.current_bid 
                        ? `Current Bid: $${listing.current_bid.toFixed(2)}`
                        : `Starting Price: $${listing.price.toFixed(2)}`}
                    </p>
                    <p className="text-gray-600 mt-2">
                      This is an auction item. You cannot edit the listing once bids are placed. The highest bidder will win when the auction ends.
                    </p>
                  </div>
                ) : (
                  <p className="text-orange-500 text-xl font-bold">${listing.price.toFixed(2)}</p>
                )}
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Category</h3>
                {isEditing ? (
                  <select
                    name="category"
                    value={editedListing.category}
                    onChange={handleInputChange}
                    className="border rounded px-2 py-1 w-full"
                  >
                    <option value="">Select a category</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-gray-600">{listing.category}</p>
                )}
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Condition</h3>
                {isEditing ? (
                  <select
                    name="condition"
                    value={editedListing.condition}
                    onChange={handleInputChange}
                    className="border rounded px-2 py-1 w-full"
                  >
                    <option value="">Select condition</option>
                    {conditions.map(condition => (
                      <option key={condition} value={condition}>{condition}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-gray-600">{listing.condition}</p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex space-x-4">
              <button
                onClick={() => setIsEditing(true)}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Edit Listing
              </button>
              <button
                onClick={() => setShowSoldModal(true)}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                Mark as Sold
              </button>
              <button
                onClick={onClose}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Close
              </button>
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete this listing? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isSubmitting}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:opacity-50"
              >
                {isSubmitting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mark as Sold Confirmation Modal */}
      {showSoldModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Mark as Sold</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to mark this listing as sold?
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowSoldModal(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkAsSold}
                disabled={isSubmitting}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
              >
                {isSubmitting ? 'Processing...' : 'Mark as Sold'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SellerListingModal; 