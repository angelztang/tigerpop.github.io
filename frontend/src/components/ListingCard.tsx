import React, { useState } from "react";
import { Listing } from "../services/listingService";

interface ListingCardProps {
  item: Listing;
  userType?: "buyer" | "seller";
  onEdit?: (listing: Listing) => void;
  onDelete?: () => void;
  onMarkAsSold?: () => void;
}

const ListingCard: React.FC<ListingCardProps> = ({ item, userType, onEdit, onDelete, onMarkAsSold }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % item.images.length);
  };

  const previousImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? item.images.length - 1 : prev - 1));
  };

  const getStatus = () => {
    if (userType === "buyer") {
      return item.status || "saved";
    } else if (userType === "seller") {
      return item.status || "listed";
    }
    return "available";
  };

  return (
    <div className="border p-4 rounded-lg shadow-md">
      {item.images && item.images.length > 0 && (
        <div className="relative">
          <img 
            src={item.images[currentImageIndex]} 
            alt={item.title} 
            className="w-full h-48 object-cover rounded-md mb-4"
          />
          {item.images.length > 1 && (
            <>
              <button onClick={previousImage} className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full w-8 h-8 flex items-center justify-center">←</button>
              <button onClick={nextImage} className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full w-8 h-8 flex items-center justify-center">→</button>
            </>
          )}
        </div>
      )}
      <h3 className="text-lg font-semibold">{item.title}</h3>
      <p className="text-gray-600">${item.price}</p>
      <p className="text-sm text-gray-500 mt-2">{item.description}</p>
      <p className="text-sm font-semibold mt-2">Status: {getStatus()}</p>
      {userType === "seller" && (
        <div className="mt-4 flex space-x-2">
          <button onClick={() => onEdit?.(item)} className="bg-blue-500 text-white px-3 py-1 rounded">Edit</button>
          <button onClick={onDelete} className="bg-red-500 text-white px-3 py-1 rounded">Delete</button>
          {item.status !== "sold" && (
            <button onClick={onMarkAsSold} className="bg-green-500 text-white px-3 py-1 rounded">Mark as Sold</button>
          )}
        </div>
      )}
    </div>
  );
};

export default ListingCard;
