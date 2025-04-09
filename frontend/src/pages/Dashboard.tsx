// Main dashboard with Buyer/Seller mode toggle
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNetid } from '../services/authService';
import { Listing } from '../services/listingService';
import SellerDashboard from "./SellerDashboard";
import BuyerDashboard from "./BuyerDashboard";
import Marketplace from "./MarketplacePage";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"buyer" | "seller">("buyer");
  const [listings, setListings] = useState<Listing[]>([]);
  const netid = 'testuser'; // Set default user

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
      </div>
    </div>
  );
};

export default Dashboard;
