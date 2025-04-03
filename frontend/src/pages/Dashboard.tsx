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
  const netid = getNetId();

  useEffect(() => {
    if (!netid) {
      navigate('/login');
    }
  }, [netid, navigate]);

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
        <div className="text-gray-600">
          Welcome, {netid}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">My Purchases</h2>
        <div className="space-y-4">
          <div className="flex space-x-4 mb-4">
            <button className="text-blue-600 font-medium">All</button>
            <button className="text-gray-500 hover:text-blue-600">Pending</button>
            <button className="text-gray-500 hover:text-blue-600">Purchased</button>
          </div>

          {listings.length === 0 ? (
            <p className="text-gray-500">You haven't purchased anything yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Listing cards would go here */}
            </div>
          )}
        </div>
      </div>

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
