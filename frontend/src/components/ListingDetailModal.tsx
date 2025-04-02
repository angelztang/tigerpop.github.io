import React, { useState } from 'react';
import { Listing } from '../services/listingService';
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
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">{listing.title}</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {listing.images && listing.images.length > 0 && (
            <div className="relative mb-4">
              <img
                src={listing.images[currentImageIndex]}
                alt={listing.title}
                className="w-full h-64 object-cover rounded-lg"
              />
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
          )}

          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">${listing.price}</h3>
              <p className="text-sm text-gray-500">Status: {getStatus()}</p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
              <p className="text-gray-600">{listing.description}</p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Category</h3>
              <p className="text-gray-600 capitalize">{listing.category}</p>
            </div>

            <div className="flex space-x-2 pt-4">
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