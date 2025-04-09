// this should be buyer's purchase history, similar to SellerDashboard
import React, { useState, useEffect } from 'react';
import { getUserPurchases, getListings } from '../services/listingService';
import { Listing } from '../services/listingService';
import ListingCard from '../components/ListingCard';
import ListingDetailModal from '../components/ListingDetailModal';

const BuyerDashboard: React.FC = () => {
  const [availableListings, setAvailableListings] = useState<Listing[]>([]);
  const [purchases, setPurchases] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      const [availableData, purchasesData] = await Promise.all([
        getListings(),
        getUserPurchases()
      ]);
      setAvailableListings(availableData);
      setPurchases(purchasesData);
    } catch (err) {
      setError('Failed to load listings');
      console.error('Error fetching listings:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Purchases Section */}
        <div>
          <h2 className="text-2xl font-semibold mb-6">My Purchases</h2>
          {purchases.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">You haven't made any purchases yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {purchases.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  onDelete={() => {}}
                  onClick={() => setSelectedListing(listing)}
                  // isPurchased={true}
                />
              ))}
            </div>
          )}
        </div>

        {selectedListing && (
          <ListingDetailModal
            listing={selectedListing}
            onClose={() => setSelectedListing(null)}
          />
        )}
      </div>
    </div>
  );
};

export default BuyerDashboard;