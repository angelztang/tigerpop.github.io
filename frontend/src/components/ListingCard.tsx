// Displays individual listing with status & update button
import React, { useState } from "react";
import { Listing } from "../services/listingService";
import PurchaseRequestForm from './PurchaseRequestForm';

interface Props {
  listing: Listing;
  onStatusUpdate?: (id: number, status: Listing['status']) => void;
}

const ListingCard: React.FC<Props> = ({ listing, onStatusUpdate }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % listing.images.length);
  };

  const previousImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? listing.images.length - 1 : prev - 1
    );
  };

  const handlePurchaseSuccess = () => {
    setShowPurchaseForm(false);
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  const getStatusColor = (status: Listing['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'sold':
        return 'bg-gray-100 text-gray-800';
      case 'removed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {listing.images && listing.images.length > 0 && (
        <div className="relative h-48">
          <img
            src={`${process.env.REACT_APP_API_URL}/uploads/${listing.images[0]}`}
            alt={listing.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-900">{listing.title}</h3>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(listing.status || 'active')}`}>
            {listing.status || 'active'}
          </span>
        </div>
        
        <p className="text-gray-600 text-sm mb-2">{listing.description}</p>
        
        <div className="flex justify-between items-center">
          <span className="text-lg font-bold text-blue-600">${listing.price}</span>
          
          {listing.status === 'active' && (
            <button
              onClick={() => setShowPurchaseForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Request to Buy
            </button>
          )}
        </div>
      </div>

      {showPurchaseForm && (
        <PurchaseRequestForm
          listingId={listing.id!}
          onSuccess={handlePurchaseSuccess}
          onCancel={() => setShowPurchaseForm(false)}
        />
      )}

      {showSuccessMessage && (
        <div className="fixed bottom-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          <p>Purchase request sent successfully!</p>
        </div>
      )}
    </div>
  );
};

export default ListingCard;
