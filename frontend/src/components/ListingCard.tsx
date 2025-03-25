// Displays individual listing with status & update button
import React, { useState } from "react";
import { Listing } from "../services/listingService";

interface ListingCardProps {
  item: Listing;
}

const ListingCard: React.FC<ListingCardProps> = ({ item }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % item.images.length);
  };

  const previousImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? item.images.length - 1 : prev - 1
    );
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
              <button
                onClick={previousImage}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full w-8 h-8 flex items-center justify-center"
              >
                ←
              </button>
              <button
                onClick={nextImage}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full w-8 h-8 flex items-center justify-center"
              >
                →
              </button>
              <div className="absolute bottom-6 left-0 right-0 flex justify-center space-x-2">
                {item.images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-2 h-2 rounded-full ${
                      index === currentImageIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
      <h3 className="text-lg font-semibold">{item.title}</h3>
      <p className="text-gray-600">${item.price}</p>
      <p className="text-sm text-gray-500 mt-2">{item.description}</p>
    </div>
  );
};

export default ListingCard;
