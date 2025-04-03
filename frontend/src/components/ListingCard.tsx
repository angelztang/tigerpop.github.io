import React, { useState } from "react";
import { Listing } from "../services/listingService";
import ListingDetailModal from "./ListingDetailModal";
import { API_URL } from "../config";

interface ListingCardProps {
  item: Listing;
  userType?: "buyer" | "seller";
  onEdit?: (listing: Listing) => void;
  onDelete?: () => void;
  onMarkAsSold?: () => void;
  onPurchase?: (listing: Listing) => void;
}

const ListingCard: React.FC<ListingCardProps> = ({ 
  item, 
  userType, 
  onEdit, 
  onDelete, 
  onMarkAsSold,
  onPurchase 
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % item.images.length);
  };

  const previousImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? item.images.length - 1 : prev - 1));
  };

  const getStatus = () => {
    if (userType === "seller") {
      return item.status || "listed";
    }
    return "available";
  };

  const getImageUrl = (path: string) => {
    // If the path is already a full URL, return it as is
    if (path.startsWith('http')) {
      return path;
    }
    // Otherwise, prepend the API_URL
    return `${API_URL}${path}`;
  };

  return (
    <>
      <div 
        className="border p-4 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow"
        onClick={() => setShowModal(true)}
      >
        {item.images && item.images.length > 0 && (
          <div className="relative aspect-w-4 aspect-h-3 mb-4">
            <img 
              src={getImageUrl(item.images[currentImageIndex])} 
              alt={item.title} 
              className="w-full h-auto object-contain rounded-md"
            />
            {item.images.length > 1 && (
              <>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    previousImage();
                  }} 
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full w-8 h-8 flex items-center justify-center"
                >
                  ←
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    nextImage();
                  }} 
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full w-8 h-8 flex items-center justify-center"
                >
                  →
                </button>
              </>
            )}
          </div>
        )}
        <h3 className="text-lg font-semibold">{item.title}</h3>
        <p className="text-gray-600">${item.price}</p>
        <p className="text-sm text-gray-500 mt-2">{item.description}</p>
        <p className="text-sm font-semibold mt-2">Status: {getStatus()}</p>
        {userType === "seller" && (
          <div 
            className="mt-4 flex space-x-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => onEdit?.(item)} 
              className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
            >
              Edit
            </button>
            <button 
              onClick={onDelete} 
              className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
            >
              Delete
            </button>
            {item.status !== "sold" && (
              <button 
                onClick={onMarkAsSold} 
                className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
              >
                Mark as Sold
              </button>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <ListingDetailModal
          listing={item}
          onClose={() => setShowModal(false)}
          userType={userType}
          onEdit={onEdit}
          onDelete={onDelete}
          onMarkAsSold={onMarkAsSold}
          onPurchase={onPurchase}
        />
      )}
    </>
  );
};

export default ListingCard;
