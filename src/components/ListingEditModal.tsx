// not sure if this is in use & what it's doing
import React, { useState, useRef, useEffect } from 'react';
import { Listing, updateListing, deleteListing, uploadImages } from '../services/listingService';
import ListingForm from './ListingForm';

interface ListingEditModalProps {
  listing: Listing;
  onClose: () => void;
  onUpdate: () => void;
}

interface ListingFormData {
  title: string;
  description: string;
  price?: number;
  category: string;
  images?: string[];
  condition: string;
  pricing_mode: string;
  selectedFiles?: File[];
}

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

const ListingEditModal: React.FC<ListingEditModalProps> = ({ listing, onClose, onUpdate }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const MAX_IMAGES = 10;
  const TITLE_LIMIT = 100;
  const DESCRIPTION_LIMIT = 1000;
  const MIN_PRICE = 0.01;
  const MAX_PRICE = 1000000000; // 1 billion

  const handleDelete = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await deleteListing(listing.id);
      onUpdate();
      onClose();
    } catch (err) {
      setError('Failed to delete listing. Please try again.');
      console.error('Error deleting listing:', err);
    } finally {
      setIsSubmitting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleSubmit = async (formData: ListingFormData) => {
    setIsSubmitting(true);
    setError(null);
    try {
      // Validate form data
      if (!formData.title.trim()) {
        setError('Title is required');
        setIsSubmitting(false);
        return;
      }
      if (formData.title.length > TITLE_LIMIT) {
        setError(`Title cannot exceed ${TITLE_LIMIT} characters`);
        setIsSubmitting(false);
        return;
      }
      if (!formData.description.trim()) {
        setError('Description is required');
        setIsSubmitting(false);
        return;
      }
      if (formData.description.length > DESCRIPTION_LIMIT) {
        setError(`Description cannot exceed ${DESCRIPTION_LIMIT} characters`);
        setIsSubmitting(false);
        return;
      }
      if (!formData.category) {
        setError('Category is required');
        setIsSubmitting(false);
        return;
      }
      if (!formData.condition) {
        setError('Condition is required');
        setIsSubmitting(false);
        return;
      }
      const price = formData.price ?? 0;
      if (price < MIN_PRICE) {
        setError(`Price must be at least $${MIN_PRICE}`);
        setIsSubmitting(false);
        return;
      }
      if (price > MAX_PRICE) {
        setError(`Price cannot exceed $${MAX_PRICE.toLocaleString()}`);
        setIsSubmitting(false);
        return;
      }

      // Check if total images exceed the limit
      const totalImages = (formData.images?.length || 0) + (formData.selectedFiles?.length || 0);
      if (totalImages > MAX_IMAGES) {
        setError(`You can only have up to ${MAX_IMAGES} images. You currently have ${totalImages} images.`);
        setIsSubmitting(false);
        return;
      }

      await updateListing(listing.id, {
        ...formData,
        price: parseFloat(formData.price?.toString() || '0.00')
      });
      onUpdate();
      onClose();
    } catch (err) {
      setError('Failed to update listing. Please try again.');
      console.error('Error updating listing:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectedFilesChange = (files: File[]) => {
    setSelectedFiles(files);
  };

  const handleImageRemove = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Edit Listing</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={isSubmitting}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <div className="mb-4">
          <h3 className="text-lg font-semibold">
            {listing.pricing_mode?.toLowerCase() === 'auction' 
              ? (listing.current_bid ? 'Current Bid' : 'Starting Price')
              : 'Price'}
          </h3>
          {listing.pricing_mode?.toLowerCase() === 'auction' ? (
            <div>
              <p className="text-2xl font-bold">
                {listing.current_bid 
                  ? `Current Bid: $${listing.current_bid.toFixed(2)}`
                  : `Starting Price: $${listing.price.toFixed(2)}`}
              </p>
              {listing.current_bid && (
                <p className="text-sm text-gray-600">
                  Current Bid: ${listing.current_bid.toFixed(2)}
                </p>
              )}
              <p className="text-sm text-gray-500 mt-1">
                Note: Pricing mode and starting price cannot be changed once listing is created
              </p>
            </div>
          ) : (
            <div>
              <p className="text-2xl font-bold">${listing.price.toFixed(2)}</p>
              <p className="text-sm text-gray-500 mt-1">
                Note: Pricing mode cannot be changed once listing is created
              </p>
            </div>
          )}
        </div>

        <ListingForm
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          initialData={{
            title: listing.title,
            description: listing.description,
            price: listing.price,
            category: listing.category,
            images: listing.images,
            condition: listing.condition,
            pricing_mode: listing.pricing_mode
          }}
          maxImages={MAX_IMAGES}
          selectedFiles={selectedFiles}
          onSelectedFilesChange={handleSelectedFilesChange}
          onImageRemove={handleImageRemove}
        />

        <div className="mt-6 flex justify-between">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors disabled:bg-red-300 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            Delete Listing
          </button>
        </div>

        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-bold mb-4">Confirm Deletion</h3>
              <p className="mb-6">Are you sure you want to delete this listing? This action cannot be undone.</p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors disabled:bg-red-300 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ListingEditModal; 