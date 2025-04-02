import React from 'react';
import { Listing } from '../services/listingService';

interface PurchaseConfirmationModalProps {
  listing: Listing;
  onClose: () => void;
  onConfirm: () => void;
}

const PurchaseConfirmationModal: React.FC<PurchaseConfirmationModalProps> = ({
  listing,
  onClose,
  onConfirm,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Confirm Purchase</h2>
        
        <div className="mb-6">
          <p className="text-gray-600 mb-2">Are you sure you want to purchase:</p>
          <p className="font-semibold text-lg">{listing.title}</p>
          <p className="text-gray-600">Price: ${listing.price}</p>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-orange-500 border border-transparent rounded-md hover:bg-orange-600"
          >
            Confirm Purchase
          </button>
        </div>
      </div>
    </div>
  );
};

export default PurchaseConfirmationModal; 