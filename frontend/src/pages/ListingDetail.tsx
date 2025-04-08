import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Listing, getListing, requestToBuy } from '../services/listingService';
import ListingDetailModal from '../components/ListingDetailModal';
import PurchaseConfirmationModal from '../components/PurchaseConfirmationModal';

const ListingDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        if (!id) {
          throw new Error('Listing ID is required');
        }
        const data = await getListing(parseInt(id));
        setListing(data);
        setError(null);
      } catch (err) {
        setError('Failed to load listing');
        console.error('Error fetching listing:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [id]);

  const handlePurchase = async (message: string, contactInfo: string) => {
    try {
      if (!listing) return;
      await requestToBuy(listing.id, message, contactInfo);
      setShowPurchaseModal(false);
      navigate('/dashboard');
    } catch (error) {
      console.error('Error requesting purchase:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (error || !listing) {
    return <div className="text-center py-12 text-red-600">{error || 'Listing not found'}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ListingDetailModal
        listing={listing}
        onClose={() => navigate(-1)}
        onPurchase={() => setShowPurchaseModal(true)}
      />
      {showPurchaseModal && (
        <PurchaseConfirmationModal
          listing={listing}
          onClose={() => setShowPurchaseModal(false)}
          onConfirm={handlePurchase}
        />
      )}
    </div>
  );
};

export default ListingDetail; 