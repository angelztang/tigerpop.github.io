import React, { useState, useEffect } from 'react';
import { Listing, getBids, Bid } from '../services/listingService';
import { requestToBuy } from '../services/listingService';
import { getUserId } from '../services/authService';
import BiddingInterface from './BiddingInterface';

interface ListingDetailModalProps {
  listing: Listing;
  isHearted: boolean;
  onHeartClick: () => void;
  onClose: () => void;
  onUpdate?: (updatedListing: Listing) => void;
  onListingUpdated?: () => void;
  onHeart: () => void;
  onUnheart: () => void;
  onRequestToBuy: () => void;
  onPlaceBid?: (amount: number) => Promise<void>;
  currentBid?: number;
  currentUserId: number;
}

const ListingDetailModal: React.FC<ListingDetailModalProps> = ({ 
  listing, 
  isHearted,
  onHeartClick,
  onClose, 
  onUpdate,
  onListingUpdated,
  onHeart,
  onUnheart,
  onRequestToBuy,
  onPlaceBid,
  currentBid,
  currentUserId,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notificationSent, setNotificationSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const userId = getUserId();
  const isSeller = userId !== null && parseInt(userId) === listing.user_id;

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

  const handleNotifySeller = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await requestToBuy(listing.id);
      setNotificationSent(true);
      onUpdate?.({ ...listing, status: 'pending' });
      onListingUpdated?.();
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: unknown) {
      console.error('Error sending notification:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to send notification';
      const errorDetails = err instanceof Error && 'details' in err ? (err as any).details : '';
      setError(`${errorMessage}${errorDetails ? `: ${errorDetails}` : ''}`);
    } finally {
      setIsSubmitting(false);
    }
  };

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold">{listing.title}</h2>
            {listing.pricing_mode === 'auction' && (
              <span className="bg-orange-100 text-orange-800 text-sm font-medium px-3 py-1 rounded">
                Auction Item
              </span>
            )}
            <div className="flex space-x-2">
              <span className="text-gray-500 text-sm">
                Posted: {new Date(listing.created_at).toLocaleDateString()}
              </span>
              <button
                onClick={onHeartClick}
                className={`p-2 rounded-full ${
                  isHearted ? 'text-red-500' : 'text-gray-400'
                } hover:text-red-500 transition-colors`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill={isHearted ? 'currentColor' : 'none'}
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </button>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
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
          </div>

          {/* Rest of the component */}
          {/* ... existing code ... */}
        </div>
      </div>
    </div>
  );
};

export default ListingDetailModal;