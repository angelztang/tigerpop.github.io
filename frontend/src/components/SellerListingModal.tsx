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

const getStatusColor = (status: string) => {
  switch (status) {
    case 'available':
      return 'bg-green-100 text-green-800';
    case 'sold':
      return 'bg-red-100 text-red-800';
    case 'pending':
      return 'bg-white text-gray-800 border border-gray-300';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

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
    if (listing.pricing_mode?.toLowerCase() === 'auction') {
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

      // For auction items, keep the original price
      const updateData = {
        ...editedListing,
        images: updatedImages,
        price: listing.pricing_mode?.toLowerCase() === 'auction' ? listing.price : editedListing.price
      };

      // Update the listing
      const updatedListing = await updateListing(listing.id, updateData);

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
              <div className="flex items-center gap-2">
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
                {listing.pricing_mode?.toLowerCase() === 'auction' && (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    🏷️ Auction
                  </span>
                )}
              </div>
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

                {listing.pricing_mode?.toLowerCase() === 'auction' && (
                  <div className="mt-4 bg-blue-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-2 text-blue-800">Auction Item</h3>
                    <p className="text-gray-700">
                      This item is being sold through an auction. You cannot edit the listing once bids are placed. The highest bidder will win when the auction ends.
                    </p>
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">
                  {listing.pricing_mode?.toLowerCase() === 'auction' 
                    ? (listing.current_bid ? 'Current Bid' : 'Starting Price')
                    : 'Price'}
                </h3>
                {listing.pricing_mode?.toLowerCase() === 'auction' ? (
                  <div>
                    <p className="text-orange-500 text-xl font-bold">
                      {listing.current_bid 
                        ? `Current Bid: $${listing.current_bid.toFixed(2)}`
                        : `Starting Price: $${listing.price.toFixed(2)}`}
                    </p>
                    {bids.length > 0 && (
                      <div className="mt-2">
                        <h4 className="text-sm font-medium text-gray-700">Bid History</h4>
                        <div className="mt-1 space-y-1">
                          {bids.map((bid) => (
                            <div key={bid.id} className="flex justify-between items-center text-sm">
                              <span className="text-gray-600">${bid.amount.toFixed(2)}</span>
                              <span className="text-gray-500">
                                {new Date(bid.timestamp).toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <p className="text-sm text-gray-500 mt-2">
                      Note: Price cannot be changed for auction items
                    </p>
                  </div>
                ) : (
                  isEditing ? (
                    <input
                      type="number"
                      name="price"
                      value={editedListing.price}
                      onChange={handleInputChange}
                      className="border rounded px-2 py-1 w-full"
                      min="0"
                      step="0.01"
                    />
                  ) : (
                    <p className="text-orange-500 text-xl font-bold">${listing.price.toFixed(2)}</p>
                  )
                )}

                <h3 className="text-lg font-semibold mb-2 mt-4">Category</h3>
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

                <h3 className="text-lg font-semibold mb-2 mt-4">Condition</h3>
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

                <h3 className="text-lg font-semibold mb-2 mt-4">Status</h3>
                <span className={`px-2 py-1 rounded-full text-sm font-medium ${getStatusColor(listing.status)}`}>
                  {listing.status}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex justify-end space-x-4">
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
                >
                  Edit Listing
                </button>
              )}
              {!isEditing && listing.status === 'available' && (
                <button
                  onClick={() => setShowSoldModal(true)}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                >
                  Mark as Sold
                </button>
              )}
              {isEditing && (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSubmitting}
                    className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </>
              )}
              <button
                onClick={() => setShowDeleteModal(true)}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Delete Listing
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