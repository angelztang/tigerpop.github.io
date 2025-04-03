// Main dashboard with Buyer/Seller mode toggle
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNetId } from '../services/authService';
import { Listing } from '../services/listingService';
import SellerDashboard from "./SellerDashboard";
import BuyerDashboard from "./BuyerDashboard";
import Marketplace from "./MarketplacePage";
import { purchaseListing } from "../services/listingService";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"buyer" | "seller">("buyer");
  const [listings, setListings] = useState<Listing[]>([]);
  const netid = 'testuser'; // Set default user

  const handlePurchase = async (listing: Listing) => {
    try {
      await purchaseListing(listing.id);
      // Refresh the listings or update the UI as needed
    } catch (error) {
      // Handle error (show error message to user)
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <button
          onClick={() => setMode(mode === "buyer" ? "seller" : "buyer")}
          className="px-4 py-2 rounded-md bg-orange-500 text-white hover:bg-orange-600 transition-colors"
        >
          Switch to {mode === "buyer" ? "Seller" : "Buyer"} Mode
        </button>
      </div>

      {/* Conditional Rendering based on mode */}
      {mode === "buyer" ? (
        <BuyerDashboard />
      ) : (
        <SellerDashboard />
      )}

      <div className="mt-8">
        <button
          onClick={() => navigate('/marketplace')}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
        >
          Browse Marketplace
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
