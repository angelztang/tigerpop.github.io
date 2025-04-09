<<<<<<< HEAD
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
  const [error, setError] = useState<string | null>(null);
=======
// Displays individual listing with status & update button
import React from 'react';
import { Listing } from '../services/listingService';
import { useNavigate } from 'react-router-dom';

interface ListingCardProps {
  listing: Listing;
  onDelete: () => void;
}

const ListingCard: React.FC<ListingCardProps> = ({ listing, onDelete }) => {
  const navigate = useNavigate();
>>>>>>> c4d72ccc050220ad09ebb324fa9247b67b9a7908

  const handleCardClick = () => {
    navigate(`/listings/${listing.id}`);
  };

<<<<<<< HEAD
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
    // If the path is already a full URL (starts with http:// or https://), return it as is
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    // Otherwise, prepend the API_URL
    return `${API_URL}${path}`;
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent modal from opening
    if (window.confirm('Are you sure you want to delete this listing?')) {
      try {
        await onDelete?.();
        setError(null);
      } catch (error) {
        console.error('Error deleting listing:', error);
        setError('Failed to delete listing. Please try again.');
      }
=======
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
      default:
        return 'bg-gray-100 text-gray-800';
>>>>>>> c4d72ccc050220ad09ebb324fa9247b67b9a7908
    }
  };

  return (
<<<<<<< HEAD
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
        
        {error && (
          <div className="mt-2 text-red-500 text-sm">
            {error}
          </div>
        )}
        
        {userType === "seller" && (
          <div className="mt-4 flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(item);
              }}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Delete
            </button>
            {item.status !== "sold" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkAsSold?.();
                }}
                className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
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
          onDelete={handleDelete}
          onMarkAsSold={onMarkAsSold}
          onPurchase={onPurchase}
        />
      )}
    </>
=======
    <div
      className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-300"
      onClick={handleCardClick}
    >
      <div className="relative aspect-w-16 aspect-h-9">
        <img
          src={listing.images?.[0] || "https://via.placeholder.com/300"}
          alt={listing.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 right-2">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
              listing.status
            )}`}
          >
            {listing.status}
          </span>
        </div>
      </div>

      <div className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold mb-1">{listing.title}</h3>
            <p className="text-gray-600 text-sm mb-2">{listing.category}</p>
            <p className="text-gray-900 font-bold">${listing.price}</p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="text-red-500 hover:text-red-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
>>>>>>> c4d72ccc050220ad09ebb324fa9247b67b9a7908
  );
};

export default ListingCard;
