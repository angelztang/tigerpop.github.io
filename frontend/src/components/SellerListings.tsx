// Fetches and displays seller's listings
import { useEffect, useState } from "react";
import ListingCard from "./ListingCard";
import React from "react";
import { fetchListings } from "../services/listingService";

const SellerListings = () => {
  const [listings, setListings] = useState([]);

  useEffect(() => {
    const getListings = async () => {
      const data = await fetchListings();
      setListings(data);
    };
    getListings();
  }, []);

  return (
    <div className="mt-4">
      <h2 className="text-xl font-semibold">Your Listings</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {listings.map((item) => (
          <ListingCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
};

export default SellerListings;
