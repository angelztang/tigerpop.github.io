// Shows seller's listings + create listing button
import React, { useState } from 'react';
import SellerListings from "../components/SellerListings";
import ListingForm from "../components/ListingForm";

const SellerDashboard: React.FC = () => {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Seller Dashboard</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Create New Listing
        </button>
      </div>

      {showForm && <ListingForm onClose={() => setShowForm(false)} />}
      <SellerListings />
    </div>
  );
};

export default SellerDashboard;
