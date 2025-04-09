import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Listing, getListing } from '../services/listingService';
import ListingDetailModal from '../components/ListingDetailModal';

const ListingDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (error || !listing) {
    return <div className="text-center py-12 text-red-600">{error || 'Listing not found'}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <ListingDetailModal
          listing={listing}
          onClose={() => navigate(-1)}
        />
      </div>
    </div>
  );
};

export default ListingDetail; 