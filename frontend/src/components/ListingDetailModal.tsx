import React, { useState, useEffect } from 'react';
import { Listing, placeBid, getBids, Bid, closeBidding } from '../services/listingService';
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
  currentBid?: number;
  currentUserId: number;
  onPlaceBid?: (amount: number) => Promise<void>;
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
  currentBid,
  currentUserId,
  onPlaceBid
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notificationSent, setNotificationSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [bidAmount, setBidAmount] = useState<string>('');
  const [bidError, setBidError] = useState<string | null>(null);
  const userId = getUserId();
  const isSeller = userId !== null && parseInt(userId) === listing.user_id;

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

  const handlePlaceBid = async () => {
    if (!bidAmount) {
      setBidError('Please enter a bid amount');
      return;
    }

    const amount = parseFloat(bidAmount);
    if (isNaN(amount) || amount <= 0) {
      setBidError('Please enter a valid bid amount');
      return;
    }

    if (bids.length > 0 && amount <= bids[0].amount) {
      setBidError('Bid must be higher than current highest bid');
      return;
    }

    setIsSubmitting(true);
    setBidError(null);

    try {
      await placeBid({
        listing_id: listing.id,
        bidder_id: currentUserId,
        amount
      });
      await fetchBids();
      setBidAmount('');
      onUpdate?.({ ...listing, current_bid: amount });
    } catch (error: any) {
      setBidError(error.message || 'Failed to place bid');
    } finally {
      setIsSubmitting(false);
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

  const handleCloseBidding = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      await closeBidding(listing.id);
      onUpdate?.({ ...listing, status: 'pending' });
      onClose();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to close bidding';
      setError(errorMessage);
      console.error('Error closing bidding:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold">{listing.title}</h2>
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

          {/* Listing Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p className="text-gray-600">{listing.description}</p>
            </div>
            <div>
              <div className="mb-4">
                <h3 className="text-lg font-semibold">Price</h3>
                {listing.pricing_mode === 'auction' ? (
                  <div>
                    <p className="text-2xl font-bold">
                      Current Bid: ${listing.current_bid?.toFixed(2) || listing.starting_price?.toFixed(2) || '0.00'}
                    </p>
                    {listing.starting_price && (
                      <p className="text-sm text-gray-600">
                        Starting Price: ${listing.starting_price.toFixed(2)}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-2xl font-bold">${listing.price.toFixed(2)}</p>
                )}
              </div>

              {/* Bid History */}
              {listing.pricing_mode === 'auction' && bids.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">Bid History</h3>
                  <div className="space-y-2">
                    {bids.map((bid) => (
                      <div key={bid.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-gray-600">
                          ${bid.amount.toFixed(2)}
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(bid.timestamp).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-4">
                <h3 className="text-lg font-semibold">Category</h3>
                <p className="text-gray-600">{listing.category}</p>
              </div>
              <div className="mb-4">
                <h3 className="text-lg font-semibold">Condition</h3>
                <p className="text-gray-600">{listing.condition}</p>
              </div>
              <div className="mb-4">
                <h3 className="text-lg font-semibold">Status</h3>
                <span className={`px-2 py-1 rounded-full text-sm font-medium ${getStatusColor(listing.status)}`}>
                  {listing.status}
                </span>
              </div>
            </div>
          </div>

          {/* Notification Button */}
          {!notificationSent && (
            <div className="mt-6">
              <button
                onClick={handleNotifySeller}
                disabled={isSubmitting}
                className="w-full bg-orange-500 text-white py-2 px-4 rounded-md hover:bg-orange-600 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Sending...' : 'Notify Seller to Buy'}
              </button>
            </div>
          )}

          {notificationSent && (
            <div className="mt-4 p-4 bg-green-100 text-green-800 rounded-md">
              <p className="font-semibold">Notification sent successfully!</p>
              <p className="text-sm mt-1">The seller will be notified via email.</p>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-100 text-red-800 rounded-md">
              <p className="font-semibold">Failed to send notification</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          )}

          {/* Bidding Interface */}
          {listing.pricing_mode === 'auction' && listing.status === 'available' && (
            <div className="mt-6">
              <BiddingInterface
                listingId={listing.id}
                currentUserId={currentUserId}
                startingPrice={listing.starting_price || 0}
                currentBid={listing.current_bid}
                isSeller={listing.user_id === currentUserId}
                onCloseBidding={handleCloseBidding}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ListingDetailModal;