// Displays individual listing with status & update button
import React from 'react';
import { Listing } from '../services/listingService';
import { useNavigate } from 'react-router-dom';
import { HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { getUserId } from '../services/authService';

interface ListingCardProps {
  listing: Listing;
  onDelete?: () => void;
  onClick?: () => void;
  isHearted?: boolean;
  onHeartClick?: (id: number) => void;
  isHot?: boolean;
  isAuction?: boolean;
}

const ListingCard: React.FC<ListingCardProps> = ({ listing, onDelete, onClick, isHearted = false, onHeartClick, isHot = false, isAuction = false }) => {
  const navigate = useNavigate();
  const currentUserId = getUserId();

  // Debug logging
  console.log('ListingCard props:', {
    listingId: listing.id,
    title: listing.title,
    pricingMode: listing.pricing_mode,
    isAuctionProp: isAuction,
    showAuctionTag: isAuction || listing.pricing_mode?.toLowerCase() === 'auction'
  });

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/listings/${listing.id}`);
    }
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/listings/${listing.id}`);
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

  // Determine if it's an auction based on both prop and listing data
  const showAuctionTag = isAuction || listing.pricing_mode?.toLowerCase() === 'auction';

  return (
    <div
      onClick={handleCardClick}
      className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transform transition hover:scale-[1.02] relative"
    >
      {/* Status Tag - Top Right */}
      <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-semibold z-10 ${getStatusColor(listing.status)}`}>
        {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
      </div>

      {/* Auction Tag - Top Left */}
      {showAuctionTag && (
        <div className="absolute top-2 left-2 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold z-10">
          🏷️ Auction Item
        </div>
      )}

      {/* Hot Item Badge - Below Auction Tag */}
      {isHot && (
        <div className="absolute top-10 left-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold z-10">
          🔥 Hot Item
        </div>
      )}

      {/* Image Section */}
      <div className="relative h-48 bg-gray-200">
        {listing.images && listing.images.length > 0 ? (
          <img
            src={listing.images[0]}
            alt={listing.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            No Image
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold mb-1">{listing.title}</h3>
            <p className="text-gray-600 text-sm mb-2">{listing.description}</p>
            <div className="text-sm">
              {showAuctionTag ? (
                listing.current_bid ? (
                  <span className="text-orange-500 font-bold">Current Bid: ${listing.current_bid.toFixed(2)}</span>
                ) : (
                  <span className="text-orange-500 font-bold">Starting Price: ${listing.price.toFixed(2)}</span>
                )
              ) : (
                <span className="text-orange-500 font-bold">Price: ${listing.price.toFixed(2)}</span>
              )}
            </div>
            <p className="text-gray-500 text-sm mb-2">
              Condition: <span className="capitalize">{listing.condition}</span>
            </p>
            <p className="text-gray-400 text-xs">
              Posted: {new Date(listing.created_at).toLocaleDateString()}
            </p>
          </div>
          {currentUserId && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onHeartClick?.(listing.id);
              }}
              className={`text-2xl transition-colors duration-200 ${
                isHearted ? 'text-red-500 hover:text-red-600' : 'text-gray-400 hover:text-gray-500'
              }`}
            >
              {isHearted ? '♥' : '♡'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ListingCard;
