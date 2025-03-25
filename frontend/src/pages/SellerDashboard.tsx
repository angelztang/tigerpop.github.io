// Shows seller's listings + create listing button
import { useState } from "react";
import SellerListings from "../components/SellerListings";
import ListingForm from "../components/ListingForm";
import React from "react";

const SellerDashboard = () => {
  const [showForm, setShowForm] = useState(false);

  return (
    <div>
      <button
        onClick={() => setShowForm(true)}
        className="bg-green-500 text-white px-4 py-2 rounded-lg"
      >
        + Create Listing
      </button>

      {showForm && <ListingForm onClose={() => setShowForm(false)} />}
      <SellerListings />
    </div>
  );
};

export default SellerDashboard;
