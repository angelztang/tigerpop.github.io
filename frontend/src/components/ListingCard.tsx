// Displays individual listing with status & update button
import React from "react";
import { updateListingStatus } from "../services/listingService";

const ListingCard = ({ item }) => {
  const handleStatusChange = async (newStatus) => {
    await updateListingStatus(item.id, newStatus);
    window.location.reload(); // Refresh for prototype simplicity
  };

  return (
    <div className="border p-4 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold">{item.title}</h3>
      <p className="text-gray-600">${item.price}</p>
      <p>Status: {item.status}</p>
      
      {item.status !== "Sold" && (
        <button
          onClick={() => handleStatusChange("Sold")}
          className="mt-2 bg-red-500 text-white px-4 py-1 rounded"
        >
          Mark as Sold
        </button>
      )}
    </div>
  );
};

export default ListingCard;
