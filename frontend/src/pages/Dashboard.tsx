// Main dashboard with Buyer/Seller mode toggle
import { useState } from "react";
import SellerDashboard from "./SellerDashboard";
import BuyerDashboard from "./BuyerDashboard";
import ListingsPage from "./Marketplace";
import React from "react";

const Dashboard = () => {
  const [mode, setMode] = useState("buyer");

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <button
          onClick={() => setMode(mode === "buyer" ? "seller" : "buyer")}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg"
        >
          Switch to {mode === "buyer" ? "Seller" : "Buyer"} Mode
        </button>
      </div>

      {mode === "seller" ? <SellerDashboard /> : <ListingsPage />}
      {/* {mode === "buyer" ? <BuyerDashboard /> : <ListingsPage />} */}
    </div>
  );
};

export default Dashboard;
