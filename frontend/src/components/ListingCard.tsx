// Displays individual listing with status & update button
import React from "react";
import { Listing } from "../services/listingService";

interface ListingCardProps {
  item: Listing;
}

const ListingCard: React.FC<ListingCardProps> = ({ item }) => {
  return (
    <div className="border p-4 rounded-lg shadow-md">
      {item.image_url && (
        <img 
          src={item.image_url} 
          alt={item.title} 
          className="w-full h-48 object-cover rounded-md mb-4"
        />
      )}
      <h3 className="text-lg font-semibold">{item.title}</h3>
      <p className="text-gray-600">${item.price}</p>
      <p className="text-sm text-gray-500 mt-2">{item.description}</p>
    </div>
  );
};

export default ListingCard;
