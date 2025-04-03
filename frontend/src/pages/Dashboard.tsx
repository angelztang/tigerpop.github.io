// Main dashboard with Buyer/Seller mode toggle
import { useState } from "react";
import SellerDashboard from "./SellerDashboard";
import BuyerDashboard from "./BuyerDashboard";
import Marketplace from "./MarketplacePage";
import React from "react";
import { purchaseListing, Listing } from "../services/listingService";

const Dashboard = () => {
  const [mode, setMode] = useState<"buyer" | "seller">("buyer");
  const username = localStorage.getItem('username'); // Get the netID from localStorage

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
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          {username && (
            <span className="text-gray-600">{username}</span>
          )}
        </div>
        <button
          onClick={() => setMode(mode === "buyer" ? "seller" : "buyer")}
          className="bg-orange-500 text-white px-4 py-2 rounded-lg"
        >
          Switch to {mode === "buyer" ? "Seller" : "Buyer"} Mode
        </button>
      </div>

      {mode === "seller" ? <SellerDashboard /> : <BuyerDashboard />}
    </div>
  );
};

export default Dashboard;
