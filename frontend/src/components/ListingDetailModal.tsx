import React, { useState } from 'react';
import { Listing } from '../services/listingService';
import { API_URL } from '../config';
import PurchaseConfirmationModal from './PurchaseConfirmationModal';

interface ListingDetailModalProps {
  listing: Listing;
  onClose: () => void;
  userType?: 'buyer' | 'seller';
  onEdit?: (listing: Listing) => void;
  onDelete?: () => void;
  onMarkAsSold?: () => void;
  onPurchase?: (listing: Listing) => void;
}

const ListingDetailModal: React.FC<ListingDetailModalProps> = ({
  listing,
  onClose,
  userType,
  onEdit,
  onDelete,
  onMarkAsSold,
  onPurchase,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showPurchaseConfirm, setShowPurchaseConfirm] = useState(false);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % listing.images.length);
  };

  const previousImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? listing.images.length - 1 : prev - 1));
  };

  const getImageUrl = (path: string) => {
    // If the path is already a full URL, return it as is
    if (path.startsWith('http')) {
      return path;
    }
    // Otherwise, prepend the API_URL
    return `${API_URL}${path}`;
  };

  const getStatus = () => {
    if (userType === "seller") {
      return listing.status || "listed";
    }
    return "available";
  };

  const handlePurchaseConfirm = () => {
    onPurchase?.(listing);
    setShowPurchaseConfirm(false);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg w-full max-w-3xl p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl"
          >
            ×
          </button>
          
          <div className="flex flex-col md:flex-row gap-6">
            {/* Left side - Image */}
            <div className="md:w-2/5">
              <div className="relative w-full">
                <div className="aspect-w-1 aspect-h-1 rounded-lg overflow-hidden">
                  <img
                    src={getImageUrl(listing.images[currentImageIndex])}
                    alt={listing.title}
                    className="w-full h-full object-contain"
                  />
                </div>
                {listing.images.length > 1 && (
                  <>
                    <button
                      onClick={previousImage}
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-75"
                    >
                      ←
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-75"
                    >
                      →
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Right side - Details */}
            <div className="md:w-3/5">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{listing.title}</h2>
              <div className="mb-4">
                <h3 className="text-xl font-semibold text-gray-900">${listing.price}</h3>
                <p className="text-sm text-gray-500">Status: {getStatus()}</p>
              </div>

              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-1">Description</h3>
                <p className="text-gray-600">{listing.description}</p>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-1">Category</h3>
                <p className="text-gray-600 capitalize">{listing.category}</p>
              </div>

              <div className="flex space-x-2">
                {userType === "seller" ? (
                  <>
                    <button
                      onClick={() => onEdit?.(listing)}
                      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={onDelete}
                      className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                    {listing.status !== "sold" && (
                      <button
                        onClick={onMarkAsSold}
                        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                      >
                        Mark as Sold
                      </button>
                    )}
                  </>
                ) : (
                  listing.status !== "sold" && (
                    <button
                      onClick={() => setShowPurchaseConfirm(true)}
                      className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
                    >
                      Purchase
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showPurchaseConfirm && (
        <PurchaseConfirmationModal
          listing={listing}
          onClose={() => setShowPurchaseConfirm(false)}
          onConfirm={handlePurchaseConfirm}
        />
      )}
    </>
  );
};

export default ListingDetailModal; 